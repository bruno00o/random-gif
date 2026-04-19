import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageFlags } from 'discord.js';
import { execute } from './randomGif.js';
import { openDatabase, type DB } from '../../../db/db.js';
import { getUserHistory } from '../../../db/history.js';

type MockInteraction = {
    options: { getString: (name: string) => string | null };
    reply: ReturnType<typeof vi.fn>;
    user: { id: string };
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
    user: { id: userId },
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

    it('calls API, replies with the gif URL, and records history', async () => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith('https://tenor/x.gif');

        const history = getUserHistory(db, 'user-1');
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            user_id: 'user-1',
            guild_id: 'guild-1',
            word: 'space cat',
            word_source: 'user',
            gif_url: 'https://tenor/x.gif',
            locale: 'FR',
        });
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

    it('replies with an ephemeral error when API returns non-200', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(new Response('{}', { status: 404 }));

        const interaction = makeInteraction({ search: 'zzzxxx', locale: null, limit: null }, db);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
        expect(getUserHistory(db, 'user-1')).toHaveLength(0);
    });
});
