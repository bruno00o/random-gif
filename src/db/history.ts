import type { DB } from './db.js';

export type WordSource = 'user' | 'random';

export type HistoryEntry = {
    id: number;
    user_id: string;
    guild_id: string | null;
    word: string;
    word_source: WordSource;
    gif_url: string;
    locale: string;
    created_at: number;
    message_id: string | null;
};

export type NewHistoryEntry = {
    user_id: string;
    guild_id: string | null;
    word: string;
    word_source: WordSource;
    gif_url: string;
    locale: string;
    created_at?: number;
    message_id?: string | null;
};

export const recordGif = (db: DB, entry: NewHistoryEntry): void => {
    db.prepare(
        `INSERT INTO gif_history (user_id, guild_id, word, word_source, gif_url, locale, created_at, message_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
        entry.user_id,
        entry.guild_id,
        entry.word,
        entry.word_source,
        entry.gif_url,
        entry.locale,
        entry.created_at ?? Date.now(),
        entry.message_id ?? null,
    );
};

export const getByMessageId = (db: DB, message_id: string): HistoryEntry | null => {
    const row = db
        .prepare('SELECT * FROM gif_history WHERE message_id = ? LIMIT 1')
        .get(message_id) as HistoryEntry | undefined;
    return row ?? null;
};

export const getUserHistory = (db: DB, user_id: string, limit = 10): HistoryEntry[] => {
    return db
        .prepare(
            `SELECT * FROM gif_history
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
        )
        .all(user_id, limit) as HistoryEntry[];
};

export type UserStats = {
    total: number;
    topWord: { word: string; count: number } | null;
    userWords: number;
    randomWords: number;
};

export const getUserStats = (db: DB, user_id: string): UserStats => {
    const total = (
        db.prepare('SELECT COUNT(*) AS n FROM gif_history WHERE user_id = ?').get(user_id) as {
            n: number;
        }
    ).n;

    const topWord =
        (db
            .prepare(
                `SELECT word, COUNT(*) AS count FROM gif_history
                 WHERE user_id = ?
                 GROUP BY word
                 ORDER BY count DESC, word ASC
                 LIMIT 1`,
            )
            .get(user_id) as { word: string; count: number } | undefined) ?? null;

    const breakdown = db
        .prepare(
            `SELECT word_source, COUNT(*) AS count FROM gif_history
             WHERE user_id = ?
             GROUP BY word_source`,
        )
        .all(user_id) as { word_source: WordSource; count: number }[];

    const userWords = breakdown.find((b) => b.word_source === 'user')?.count ?? 0;
    const randomWords = breakdown.find((b) => b.word_source === 'random')?.count ?? 0;

    return { total, topWord, userWords, randomWords };
};

export const forgetUser = (db: DB, user_id: string): { history: number; preferences: number } => {
    const tx = db.transaction(() => {
        const history = db
            .prepare('DELETE FROM gif_history WHERE user_id = ?')
            .run(user_id).changes;
        const preferences = db
            .prepare('DELETE FROM user_preferences WHERE user_id = ?')
            .run(user_id).changes;
        return { history, preferences };
    });
    return tx();
};
