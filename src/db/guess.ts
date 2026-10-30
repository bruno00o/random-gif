import type { DB } from './db.js';
import { ONE_YEAR_MS } from './db.js';

export type GuessStatus = 'open' | 'won' | 'given_up';

export type GuessGame = {
    message_id: string;
    word: string;
    user_id: string;
    guild_id: string | null;
    gif_url: string;
    revealed: number;
    status: GuessStatus;
    winner_id: string | null;
    created_at: number;
};

export type NewGuessGame = Pick<GuessGame, 'message_id' | 'word' | 'user_id' | 'guild_id' | 'gif_url'>;

export type LeaderboardEntry = {
    user_id: string;
    points: number;
    wins: number;
};

export const createGame = (db: DB, game: NewGuessGame): void => {
    db.prepare(
        `INSERT INTO guess_games (message_id, word, user_id, guild_id, gif_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(game.message_id, game.word, game.user_id, game.guild_id, game.gif_url, Date.now());
};

export const getGame = (db: DB, message_id: string): GuessGame | null => {
    const row = db.prepare('SELECT * FROM guess_games WHERE message_id = ?').get(message_id) as
        | GuessGame
        | undefined;
    return row ?? null;
};

export const revealLetter = (db: DB, message_id: string): void => {
    db.prepare(
        `UPDATE guess_games
         SET revealed = MIN(revealed + 1, MAX(LENGTH(word) - 1, 0))
         WHERE message_id = ? AND status = 'open'`,
    ).run(message_id);
};

export const winGame = (db: DB, game: GuessGame, winner_id: string, points: number): boolean => {
    const tx = db.transaction(() => {
        const won = db
            .prepare(
                `UPDATE guess_games SET status = 'won', winner_id = ?
                 WHERE message_id = ? AND status = 'open'`,
            )
            .run(winner_id, game.message_id).changes;
        if (won === 0) return false;

        if (game.guild_id) {
            db.prepare(
                `INSERT INTO guess_scores (guild_id, user_id, points, wins)
                 VALUES (?, ?, ?, 1)
                 ON CONFLICT (guild_id, user_id)
                 DO UPDATE SET points = points + excluded.points, wins = wins + 1`,
            ).run(game.guild_id, winner_id, points);
        }
        return true;
    });
    return tx();
};

export const giveUpGame = (db: DB, message_id: string): boolean =>
    db
        .prepare(`UPDATE guess_games SET status = 'given_up' WHERE message_id = ? AND status = 'open'`)
        .run(message_id).changes === 1;

export const getLeaderboard = (db: DB, guild_id: string, limit = 10): LeaderboardEntry[] =>
    db
        .prepare(
            `SELECT user_id, points, wins FROM guess_scores
             WHERE guild_id = ?
             ORDER BY points DESC, wins DESC, user_id ASC
             LIMIT ?`,
        )
        .all(guild_id, limit) as LeaderboardEntry[];

export const purgeOldGames = (db: DB, olderThanMs: number = ONE_YEAR_MS): number => {
    const threshold = Date.now() - olderThanMs;
    return db.prepare('DELETE FROM guess_games WHERE created_at < ?').run(threshold).changes;
};
