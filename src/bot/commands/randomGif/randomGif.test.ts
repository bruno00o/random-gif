import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageFlags } from 'discord.js';
import { execute } from './randomGif.js';

type MockInteraction = {
    options: { getString: (name: string) => string | null };
    reply: ReturnType<typeof vi.fn>;
};

const makeInteraction = (opts: Record<string, string | null>): MockInteraction => ({
    options: { getString: (name: string) => opts[name] ?? null },
    reply: vi.fn().mockResolvedValue(undefined),
});

describe('random-gif slash command', () => {
    beforeEach(() => {
        process.env.URL_API = 'http://api.test';
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('replies ephemerally when limit is out of range', async () => {
        const interaction = makeInteraction({ search: null, locale: null, limit: '99' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('between 1 and 50'),
            flags: MessageFlags.Ephemeral,
        });
    });

    it('replies ephemerally when limit is not a number', async () => {
        const interaction = makeInteraction({ search: null, locale: null, limit: 'abc' });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({ flags: MessageFlags.Ephemeral }),
        );
    });

    it('calls API with encoded query params and replies with the gif URL', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ gif: 'https://tenor/x.gif' })),
        );

        const interaction = makeInteraction({
            search: 'space cat',
            locale: 'FR',
            limit: '10',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await execute(interaction as any);

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('http://api.test/random-gif');
        expect(calledUrl).toContain('locale=FR');
        expect(calledUrl).toContain('numberOfResults=10');
        expect(calledUrl).toMatch(/request=space[%+]20cat|request=space%2520cat/);

        expect(interaction.reply).toHaveBeenCalledWith('https://tenor/x.gif');
    });
});
