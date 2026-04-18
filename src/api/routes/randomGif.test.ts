import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import randomGif from './randomGif.js';

const makeTenorResponse = (url: string) =>
    new Response(
        JSON.stringify({
            results: [{ media_formats: { gif: { url } } }],
        }),
    );

describe('GET /random-gif', () => {
    const app = new Hono().route('/', randomGif);

    beforeEach(() => {
        process.env.TENOR_KEY = 'test-key';
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('uses a provided search word and returns the gif', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(makeTenorResponse('https://tenor/test.gif'));

        const res = await app.request('/?request=cat&locale=FR&numberOfResults=5');

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({
            word: 'cat',
            gif: 'https://tenor/test.gif',
            locale: 'FR',
            numberOfResults: 5,
        });
        const calledUrl = mockFetch.mock.calls[0][0] as string;
        expect(calledUrl).toContain('q=cat');
        expect(calledUrl).toContain('locale=FR');
        expect(calledUrl).toContain('limit=5');
    });

    it('falls back to a random word when no request is given', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(['dolphin'])));
        mockFetch.mockResolvedValueOnce(makeTenorResponse('https://tenor/x.gif'));

        const res = await app.request('/');

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.word).toBe('dolphin');
        expect(body.locale).toBe('US');
        expect(body.numberOfResults).toBe(10);
    });

    it('rejects malicious locale and falls back to US', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(['cat'])));
        mockFetch.mockResolvedValueOnce(makeTenorResponse('https://tenor/x.gif'));

        const res = await app.request('/?locale=FR;DROP');

        const body = await res.json();
        expect(body.locale).toBe('US');
    });

    it('ignores non-numeric numberOfResults', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(['cat'])));
        mockFetch.mockResolvedValueOnce(makeTenorResponse('https://tenor/x.gif'));

        const res = await app.request('/?numberOfResults=abc');

        const body = await res.json();
        expect(body.numberOfResults).toBe(10);
    });
});
