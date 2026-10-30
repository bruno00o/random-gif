export type GifResponse = {
    word: string;
    gif: string;
    locale: string;
    numberOfResults: number;
};

export const fetchGif = async (
    search: string | null,
    locale: string | null,
    limit: string | null,
): Promise<GifResponse | null> => {
    const url = new URL(`${process.env.URL_API}/random-gif`);
    if (search) url.searchParams.append('request', encodeURIComponent(search));
    if (locale) url.searchParams.append('locale', locale);
    if (limit) url.searchParams.append('numberOfResults', limit);

    try {
        const response = await fetch(url.href);
        if (!response.ok) return null;
        return (await response.json()) as GifResponse;
    } catch (err) {
        console.error('Failed to fetch gif:', err);
        return null;
    }
};
