import { Hono } from 'hono';
import { generate } from 'random-words';

const KLIPY_URL = 'https://api.klipy.com/api/v1';

type KlipyVariant = { gif?: { url: string } };
type KlipyItem = {
    type: string;
    file: { hd?: KlipyVariant; md?: KlipyVariant; sm?: KlipyVariant; xs?: KlipyVariant };
};
type KlipyResult = { data?: { data?: KlipyItem[] } };

// Klipy serves several size variants per GIF; prefer the largest available.
const pickGifUrl = (file: KlipyItem['file']): string | null =>
    file.hd?.gif?.url ?? file.md?.gif?.url ?? file.sm?.gif?.url ?? file.xs?.gif?.url ?? null;

export const getGif = async (word: string, locale: string, limit: number): Promise<string | null> => {
    const key = process.env.KLIPY_KEY;
    // Klipy requires per_page in [8, 50]; we still only pick from the first `limit` results.
    const perPage = Math.min(50, Math.max(8, limit));
    const url = `${KLIPY_URL}/${key}/gifs/search?q=${encodeURIComponent(word)}&per_page=${perPage}&page=1&locale=${locale}`;
    const response = await fetch(url);
    const data = (await response.json()) as KlipyResult;
    // Klipy may inject ads between results — keep only actual GIFs.
    const items = (data.data?.data ?? []).filter((item) => item.type === 'gif');
    if (items.length === 0) return null;
    const pool = items.slice(0, limit);
    const index = Math.floor(Math.random() * pool.length);
    return pickGifUrl(pool[index].file);
};

// Map a 2-letter region code (e.g. "US", "FR") to Klipy's ISO 3166 locale form ("us_US").
const toKlipyLocale = (locale: string): string => {
    const code = locale.slice(0, 2).toLowerCase();
    return `${code}_${code.toUpperCase()}`;
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

    const gif = await getGif(word, toKlipyLocale(locale), limit);

    if (gif === null) {
        return c.json({ error: 'No GIF found', word, locale }, 404);
    }

    return c.json({ word, gif, locale, numberOfResults: limit });
});

export default randomGif;
