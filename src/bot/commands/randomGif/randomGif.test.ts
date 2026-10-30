import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ButtonInteraction, MessageFlags } from 'discord.js';
import { execute, handleButton } from './randomGif.js';
import { openDatabase, type DB } from '../../../db/db.js';
import { getByMessageId, getUserHistory, recordGif } from '../../../db/history.js';

type MockInteraction = {
    options: { getString: (name: string) => string | null };
    reply: ReturnType<typeof vi.fn>;
    deferReply: ReturnType<typeof vi.fn>;
    editReply: ReturnType<typeof vi.fn>;
    deleteReply: ReturnType<typeof vi.fn>;
    followUp: ReturnType<typeof vi.fn>;
    user: { id: string };
    locale: string;
    guildId: string | null;
    client: { db: DB };
};

const makeInteraction = (
    opts: Record<string, string | null>,
    db: DB,
    userId = 'user-1',
    guildId: string | null = 'guild-1',
): MockInteraction => ({
    options: { getString: (name: string) => opts[name] ?? null },
    reply: vi.fn().mockResolvedValue(undefined),
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue({ id: 'msg-123' }),
    deleteReply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    user: { id: userId },
    locale: 'en-US',
    guildId,
    client: { db },
});

describe('random-gif slash command', () => {
    let db: DB;

    beforeEach(() => {
        process.env.URL_API = 'http://api.test';
        vi.stubGlobal('fetch', vi.fn());
        db = openDatabase(':memory:');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('replies ephemerally when limit is out of range', async () => {
        const interaction = makeInteraction({ search: null, locale: null, limit: '99' }, db);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('between 1 and 50'),
            flags: MessageFlags.Ephemeral,
        });
        expect(getUserHistory(db, 'user-1')).toHaveLength(0);
    });

    it('replies ephemerally when limit is not a number', async () => {
        const interaction = makeInteraction({ search: null, locale: null, limit: 'abc' }, db);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
    });

    it('calls API, replies with the gif URL, and records history with message_id', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    word: 'space cat',
                    gif: 'https://tenor/x.gif',
                    locale: 'FR',
                    numberOfResults: 10,
                }),
            ),
        );

        const interaction = makeInteraction(
            { search: 'space cat', locale: 'FR', limit: '10' },
            db,
        );
        interaction.editReply.mockResolvedValueOnce({ id: 'msg-abc' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.deferReply).toHaveBeenCalledOnce();
        expect(interaction.editReply).toHaveBeenCalledWith({
            content: 'https://tenor/x.gif',
            components: [expect.anything()],
        });
        const [row] = interaction.editReply.mock.calls[0][0].components;
        expect(row.toJSON().components[0]).toMatchObject({
            custom_id: 'random-gif:reroll',
            label: 'Reroll',
        });

        const history = getUserHistory(db, 'user-1');
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            user_id: 'user-1',
            guild_id: 'guild-1',
            word: 'space cat',
            word_source: 'user',
            gif_url: 'https://tenor/x.gif',
            locale: 'FR',
            message_id: 'msg-abc',
        });
    });

    it('labels the button and the errors in French for a French client', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    word: 'chat',
                    gif: 'https://klipy/c.gif',
                    locale: 'FR',
                    numberOfResults: 10,
                }),
            ),
        );
        mockFetch.mockResolvedValueOnce(new Response('{}', { status: 404 }));

        const success = makeInteraction({ search: 'chat', locale: null, limit: null }, db);
        success.locale = 'fr';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(success as any);
        const [row] = success.editReply.mock.calls[0][0].components;
        expect(row.toJSON().components[0].label).toBe('Relancer');

        const failure = makeInteraction({ search: 'zzz', locale: null, limit: null }, db);
        failure.locale = 'fr';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(failure as any);
        expect(failure.followUp.mock.calls[0][0].content).toContain('Aucun GIF');
    });

    it('records random word_source when no search option is given', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    word: 'dolphin',
                    gif: 'https://tenor/d.gif',
                    locale: 'US',
                    numberOfResults: 10,
                }),
            ),
        );

        const interaction = makeInteraction({ search: null, locale: null, limit: null }, db);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        const history = getUserHistory(db, 'user-1');
        expect(history[0].word_source).toBe('random');
    });

    it('replaces the deferred reply with an ephemeral error when API returns non-200', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(new Response('{}', { status: 404 }));

        const interaction = makeInteraction({ search: 'zzzxxx', locale: null, limit: null }, db);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.deleteReply).toHaveBeenCalledOnce();
        expect(interaction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(getUserHistory(db, 'user-1')).toHaveLength(0);
    });

    it('replaces the deferred reply with an ephemeral error when the API is unreachable', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(fetch).mockRejectedValueOnce(new Error('connection refused'));

        const interaction = makeInteraction({ search: 'cat', locale: null, limit: null }, db);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.deleteReply).toHaveBeenCalledOnce();
        expect(interaction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
    });
});

describe('random-gif reroll button', () => {
    let db: DB;

    const makeButton = (userId = 'user-1', messageId = 'msg-1') => {
        const interaction = {
            message: { id: messageId },
            user: { id: userId },
            locale: 'en-US',
            client: { db },
            reply: vi.fn().mockResolvedValue(undefined),
            deferUpdate: vi.fn().mockResolvedValue(undefined),
            editReply: vi.fn().mockResolvedValue({ id: messageId }),
            followUp: vi.fn().mockResolvedValue(undefined),
        };
        return { interaction, press: () => handleButton(interaction as unknown as ButtonInteraction) };
    };

    beforeEach(() => {
        process.env.URL_API = 'http://api.test';
        vi.stubGlobal('fetch', vi.fn());
        db = openDatabase(':memory:');
        recordGif(db, {
            user_id: 'user-1',
            guild_id: 'guild-1',
            word: 'space cat',
            word_source: 'user',
            gif_url: 'https://klipy/old.gif',
            locale: 'FR',
            message_id: 'msg-1',
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('edits the message with a new gif for the same word and updates history', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    word: 'space cat',
                    gif: 'https://klipy/new.gif',
                    locale: 'FR',
                    numberOfResults: 50,
                }),
            ),
        );

        const { interaction, press } = makeButton();
        await press();

        const requested = new URL(mockFetch.mock.calls[0][0] as string);
        expect(decodeURIComponent(requested.searchParams.get('request') ?? '')).toBe('space cat');
        expect(requested.searchParams.get('locale')).toBe('FR');
        expect(requested.searchParams.get('numberOfResults')).toBe('50');

        expect(interaction.deferUpdate).toHaveBeenCalledOnce();
        expect(interaction.editReply).toHaveBeenCalledWith({
            content: 'https://klipy/new.gif',
            components: [expect.anything()],
        });
        expect(getByMessageId(db, 'msg-1')?.gif_url).toBe('https://klipy/new.gif');
        expect(getUserHistory(db, 'user-1')).toHaveLength(1);
    });

    it('refuses anyone but the original requester without calling the API', async () => {
        const { interaction, press } = makeButton('someone-else');
        await press();

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(fetch).not.toHaveBeenCalled();
        expect(interaction.reply.mock.calls[0][0].content).not.toContain('space cat');
        expect(getByMessageId(db, 'msg-1')?.gif_url).toBe('https://klipy/old.gif');
    });

    it('explains when the history entry no longer exists', async () => {
        const { interaction, press } = makeButton('user-1', 'forgotten');
        await press();

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(fetch).not.toHaveBeenCalled();
    });

    it('keeps the current gif and warns ephemerally when the API fails', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 500 }));

        const { interaction, press } = makeButton();
        await press();

        expect(interaction.editReply).not.toHaveBeenCalled();
        expect(interaction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(getByMessageId(db, 'msg-1')?.gif_url).toBe('https://klipy/old.gif');
    });
});
