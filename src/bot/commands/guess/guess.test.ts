import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
    ModalSubmitInteraction,
} from 'discord.js';
import { execute, handleButton, handleModal, maskWord, normalizeWord, pointsFor } from './guess.js';
import { openDatabase, type DB } from '../../../db/db.js';
import { createGame, getGame, getLeaderboard } from '../../../db/guess.js';
import { getByMessageId } from '../../../db/history.js';

const seed = (db: DB, word = 'cat', guild_id: string | null = 'g1') =>
    createGame(db, {
        message_id: 'm1',
        word,
        user_id: 'starter',
        guild_id,
        gif_url: 'https://klipy/c.gif',
    });

const makeButton = (db: DB, customId: string, userId = 'player', locale = 'en-US') => {
    const interaction = {
        customId,
        locale,
        message: { id: 'm1' },
        user: { id: userId },
        client: { db },
        reply: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
        showModal: vi.fn().mockResolvedValue(undefined),
    };
    return { interaction, press: () => handleButton(interaction as unknown as ButtonInteraction) };
};

const makeModal = (db: DB, answer: string, userId = 'player', locale = 'en-US') => {
    const interaction = {
        locale,
        message: { id: 'm1' },
        user: { id: userId },
        client: { db },
        isFromMessage: () => true,
        fields: { getTextInputValue: () => answer },
        reply: vi.fn().mockResolvedValue(undefined),
        update: vi.fn().mockResolvedValue(undefined),
    };
    return {
        interaction,
        submit: () => handleModal(interaction as unknown as ModalSubmitInteraction),
    };
};

const makeCommand = (db: DB, subcommand: string, guildId: string | null = 'g1') => {
    const interaction = {
        locale: 'en-US',
        guildId,
        user: { id: 'starter' },
        client: { db },
        options: { getSubcommand: () => subcommand },
        reply: vi.fn().mockResolvedValue(undefined),
        deferReply: vi.fn().mockResolvedValue(undefined),
        editReply: vi.fn().mockResolvedValue({ id: 'm1' }),
        deleteReply: vi.fn().mockResolvedValue(undefined),
        followUp: vi.fn().mockResolvedValue(undefined),
    };
    return { interaction, run: () => execute(interaction as unknown as ChatInputCommandInteraction) };
};

describe('guess helpers', () => {
    it('ignores case, accents and surrounding spaces', () => {
        expect(normalizeWord('  Été ')).toBe(normalizeWord('ete'));
    });

    it('masks every letter that is not revealed yet', () => {
        expect(maskWord('cat', 0)).toBe('_ _ _');
        expect(maskWord('cat', 2)).toBe('c a _');
    });

    it('lowers the points with each hint, down to one', () => {
        expect([0, 1, 2, 3, 9].map(pointsFor)).toEqual([3, 2, 1, 1, 1]);
    });
});

describe('/guess play', () => {
    let db: DB;

    beforeEach(() => {
        process.env.URL_API = 'http://api.test';
        vi.stubGlobal('fetch', vi.fn());
        db = openDatabase(':memory:');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('posts the GIF without the word and stores the game outside the history', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    word: 'dolphin',
                    gif: 'https://klipy/d.gif',
                    locale: 'US',
                    numberOfResults: 10,
                }),
            ),
        );

        const { interaction, run } = makeCommand(db, 'play');
        await run();

        const requested = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
        expect(requested.searchParams.has('request')).toBe(false);

        const payload = interaction.editReply.mock.calls[0][0];
        const posted = JSON.stringify([
            payload.embeds.map((embed: { toJSON: () => unknown }) => embed.toJSON()),
            payload.components.map((row: { toJSON: () => unknown }) => row.toJSON()),
        ]);
        expect(posted).not.toContain('dolphin');
        expect(posted).toContain('https://klipy/d.gif');

        expect(getGame(db, 'm1')).toMatchObject({ word: 'dolphin', user_id: 'starter', guild_id: 'g1' });
        expect(getByMessageId(db, 'm1')).toBeNull();
    });

    it('replaces the deferred reply with an ephemeral error when the API fails', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 500 }));

        const { interaction, run } = makeCommand(db, 'play');
        await run();

        expect(interaction.deleteReply).toHaveBeenCalledOnce();
        expect(interaction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(getGame(db, 'm1')).toBeNull();
    });
});

describe('/guess leaderboard', () => {
    let db: DB;

    beforeEach(() => {
        db = openDatabase(':memory:');
    });

    it('is refused outside a server', async () => {
        const { interaction, run } = makeCommand(db, 'leaderboard', null);
        await run();

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
    });

    it('says so when nobody has won yet', async () => {
        const { interaction, run } = makeCommand(db, 'leaderboard');
        await run();

        expect(interaction.reply.mock.calls[0][0].content).toContain('Nobody has won');
    });

    it('lists the players by rank', async () => {
        seed(db);
        await makeModal(db, 'cat').submit();

        const { interaction, run } = makeCommand(db, 'leaderboard');
        await run();

        const embed = interaction.reply.mock.calls[0][0].embeds[0].toJSON();
        expect(embed.description).toBe('1. <@player>: 3 points (1 win)');
    });
});

describe('guess buttons', () => {
    let db: DB;

    beforeEach(() => {
        db = openDatabase(':memory:');
        seed(db);
    });

    it('opens the answer form', async () => {
        const { interaction, press } = makeButton(db, 'guess:answer');
        await press();

        expect(interaction.showModal).toHaveBeenCalledOnce();
    });

    it('reveals one more letter on hint and disables the button at the last one', async () => {
        const first = makeButton(db, 'guess:hint');
        await first.press();
        const firstUpdate = first.interaction.update.mock.calls[0][0];
        expect(firstUpdate.embeds[0].toJSON().description).toContain('c _ _');
        expect(firstUpdate.components[0].toJSON().components[1].disabled).toBe(false);

        const second = makeButton(db, 'guess:hint');
        await second.press();
        const secondUpdate = second.interaction.update.mock.calls[0][0];
        expect(secondUpdate.embeds[0].toJSON().description).toContain('c a _');
        expect(secondUpdate.components[0].toJSON().components[1].disabled).toBe(true);
    });

    it('refuses to give up for anyone but the starter, without leaking the word', async () => {
        const { interaction, press } = makeButton(db, 'guess:give-up', 'someone-else');
        await press();

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(interaction.reply.mock.calls[0][0].content).not.toContain('cat');
        expect(getGame(db, 'm1')?.status).toBe('open');
    });

    it('reveals the word and removes the buttons when the starter gives up', async () => {
        const { interaction, press } = makeButton(db, 'guess:give-up', 'starter');
        await press();

        const update = interaction.update.mock.calls[0][0];
        expect(update.embeds[0].toJSON().description).toContain('**cat**');
        expect(update.components).toEqual([]);
        expect(getGame(db, 'm1')?.status).toBe('given_up');
    });

    it('tells that the game is over once finished', async () => {
        await makeModal(db, 'cat').submit();

        const { interaction, press } = makeButton(db, 'guess:hint');
        await press();

        expect(interaction.update).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
    });
});

describe('guess answers', () => {
    let db: DB;

    beforeEach(() => {
        db = openDatabase(':memory:');
    });

    it('keeps a wrong answer private and the game open', async () => {
        seed(db);
        const { interaction, submit } = makeModal(db, 'dog');
        await submit();

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(interaction.update).not.toHaveBeenCalled();
        expect(getGame(db, 'm1')?.status).toBe('open');
    });

    it('announces the winner and the points, and closes the game', async () => {
        seed(db);
        const { interaction, submit } = makeModal(db, ' CAT ');
        await submit();

        const update = interaction.update.mock.calls[0][0];
        expect(update.embeds[0].toJSON().description).toBe(
            '<@player> found the word: **cat** (+3 points)',
        );
        expect(update.components).toEqual([]);
        expect(getLeaderboard(db, 'g1')).toEqual([{ user_id: 'player', points: 3, wins: 1 }]);
    });

    it('gives fewer points after a hint', async () => {
        seed(db);
        await makeButton(db, 'guess:hint').press();
        await makeModal(db, 'cat').submit();

        expect(getLeaderboard(db, 'g1')[0].points).toBe(2);
    });

    it('does not mention points outside a server', async () => {
        seed(db, 'cat', null);
        const { interaction, submit } = makeModal(db, 'cat');
        await submit();

        expect(interaction.update.mock.calls[0][0].embeds[0].toJSON().description).toBe(
            '<@player> found the word: **cat**',
        );
    });

    it('answers in French for a French client', async () => {
        seed(db);
        const { interaction, submit } = makeModal(db, 'cat', 'player', 'fr');
        await submit();

        expect(interaction.update.mock.calls[0][0].embeds[0].toJSON().title).toBe(
            'Devine le mot (en anglais)',
        );
    });
});
