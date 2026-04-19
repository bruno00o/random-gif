import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageFlags } from 'discord.js';
import { execute } from './revealWord.js';
import { openDatabase, type DB } from '../../../db/db.js';
import { recordGif } from '../../../db/history.js';
import { setVisibility } from '../../../db/preferences.js';

type MockInteraction = {
    targetMessage: { id: string; author: { id: string } };
    user: { id: string };
    client: { user: { id: string }; db: DB };
    reply: ReturnType<typeof vi.fn>;
};

const BOT_ID = 'bot-id';

const makeInteraction = (
    db: DB,
    {
        messageId,
        messageAuthorId = BOT_ID,
        clickerId,
    }: { messageId: string; messageAuthorId?: string; clickerId: string },
): MockInteraction => ({
    targetMessage: { id: messageId, author: { id: messageAuthorId } },
    user: { id: clickerId },
    client: { user: { id: BOT_ID }, db },
    reply: vi.fn().mockResolvedValue(undefined),
});

describe('revealWord context menu', () => {
    let db: DB;

    beforeEach(() => {
        db = openDatabase(':memory:');
    });

    it('rejects messages not authored by the bot', async () => {
        const interaction = makeInteraction(db, {
            messageId: 'm1',
            messageAuthorId: 'someone-else',
            clickerId: 'clicker',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('not a random-gif message'),
                flags: MessageFlags.Ephemeral,
            }),
        );
    });

    it('replies "no word found" when message_id is not in history', async () => {
        const interaction = makeInteraction(db, { messageId: 'untracked', clickerId: 'clicker' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('No word found'),
                flags: MessageFlags.Ephemeral,
            }),
        );
    });

    it('reveals the word when the searcher is public', async () => {
        recordGif(db, {
            user_id: 'searcher',
            guild_id: null,
            word: 'cat',
            word_source: 'user',
            gif_url: 'https://x/cat.gif',
            locale: 'US',
            message_id: 'msg-1',
        });
        setVisibility(db, 'searcher', 'public');

        const interaction = makeInteraction(db, { messageId: 'msg-1', clickerId: 'nosy' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('searched for **cat**'),
                flags: MessageFlags.Ephemeral,
            }),
        );
    });

    it('blocks reveal to others when searcher is private', async () => {
        recordGif(db, {
            user_id: 'searcher',
            guild_id: null,
            word: 'secret',
            word_source: 'user',
            gif_url: 'https://x/s.gif',
            locale: 'US',
            message_id: 'msg-2',
        });
        // no setVisibility → default private

        const interaction = makeInteraction(db, { messageId: 'msg-2', clickerId: 'nosy' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('keeps their words private'),
                flags: MessageFlags.Ephemeral,
            }),
        );
    });

    it('lets the searcher see their own word even when private', async () => {
        recordGif(db, {
            user_id: 'searcher',
            guild_id: null,
            word: 'mine',
            word_source: 'user',
            gif_url: 'https://x/m.gif',
            locale: 'US',
            message_id: 'msg-3',
        });
        // default private

        const interaction = makeInteraction(db, { messageId: 'msg-3', clickerId: 'searcher' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('searched for **mine**'),
            }),
        );
    });

    it('uses "got a random" phrasing for random words', async () => {
        recordGif(db, {
            user_id: 'searcher',
            guild_id: null,
            word: 'dolphin',
            word_source: 'random',
            gif_url: 'https://x/d.gif',
            locale: 'US',
            message_id: 'msg-4',
        });
        setVisibility(db, 'searcher', 'public');

        const interaction = makeInteraction(db, { messageId: 'msg-4', clickerId: 'nosy' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.stringContaining('got a random **dolphin**'),
            }),
        );
    });
});
