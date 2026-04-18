import { Hono } from 'hono';

const TENOR_URL = 'https://tenor.googleapis.com/v2/search';
const RANDOM_WORD_URL = 'https://words.allmyapis.me/api/random_word';

type TenorResult = {
    results: Array<{ media_formats: { gif: { url: string } } }>;
};

export const getGif = async (word: string, locale: string, limit: number): Promise<string> => {
    const key = process.env.TENOR_KEY;
    const url = `${TENOR_URL}?key=${key}&q=${encodeURIComponent(word)}&limit=${limit}&media_filter=gif&locale=${locale}`;
    const response = await fetch(url);
    const data = (await response.json()) as TenorResult;
    const index = Math.floor(Math.random() * data.results.length);
    return data.results[index].media_formats.gif.url;
};

const getRandomWord = async (): Promise<string> => {
    const response = await fetch(RANDOM_WORD_URL);
    const data = (await response.json()) as [string];
    return data[0];
};

const randomGif = new Hono();

randomGif.get('/', async (c) => {
    const rawRequest = c.req.query('request');
    const rawLocale = c.req.query('locale');
    const rawLimit = c.req.query('numberOfResults');

    const word = rawRequest ? decodeURIComponent(rawRequest) : await getRandomWord();
    const locale = rawLocale && /^[a-zA-Z]+$/.test(rawLocale) ? rawLocale : 'US';
    const limit = rawLimit && /^[0-9]+$/.test(rawLimit) ? Number(rawLimit) : 10;

    const gif = await getGif(word, locale, limit);

    return c.json({ word, gif, locale, numberOfResults: limit });
});

export default randomGif;
