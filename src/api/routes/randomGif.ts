import { Hono } from 'hono';
import { generate } from 'random-words';

const TENOR_URL = 'https://tenor.googleapis.com/v2/search';

type TenorResult = {
    results: Array<{ media_formats: { gif: { url: string } } }>;
};

export const getGif = async (word: string, locale: string, limit: number): Promise<string | null> => {
    const key = process.env.TENOR_KEY;
    const url = `${TENOR_URL}?key=${key}&q=${encodeURIComponent(word)}&limit=${limit}&media_filter=gif&locale=${locale}`;
    const response = await fetch(url);
    const data = (await response.json()) as TenorResult;
    if (data.results.length === 0) return null;
    const index = Math.floor(Math.random() * data.results.length);
    return data.results[index].media_formats.gif.url;
};

const getRandomWord = (): string => generate({ exactly: 1 })[0];

const parseLimit = (raw: string | undefined): number => {
    if (!raw || !/^[0-9]+$/.test(raw)) return 10;
    return Math.min(50, Math.max(1, Number(raw)));
};

const randomGif = new Hono();

randomGif.get('/', async (c) => {
    const rawRequest = c.req.query('request');
    const rawLocale = c.req.query('locale');
    const rawLimit = c.req.query('numberOfResults');

    const word = rawRequest ? decodeURIComponent(rawRequest) : getRandomWord();
    const locale = rawLocale && /^[a-zA-Z]+$/.test(rawLocale) ? rawLocale : 'US';
    const limit = parseLimit(rawLimit);

    const gif = await getGif(word, locale, limit);

    if (gif === null) {
        return c.json({ error: 'No GIF found', word, locale }, 404);
    }

    return c.json({ word, gif, locale, numberOfResults: limit });
});

export default randomGif;
