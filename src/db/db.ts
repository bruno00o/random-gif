import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type DB = Database.Database;

export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const openDatabase = (path: string): DB => {
    if (path !== ':memory:') {
        mkdirSync(dirname(path), { recursive: true });
    }
    const db = new Database(path);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    return db;
};

const initSchema = (db: DB) => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS gif_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT NOT NULL,
            guild_id    TEXT,
            word        TEXT NOT NULL,
            word_source TEXT NOT NULL CHECK(word_source IN ('user', 'random')),
            gif_url     TEXT NOT NULL,
            locale      TEXT NOT NULL,
            created_at  INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_history_user
            ON gif_history(user_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_history_created
            ON gif_history(created_at);

        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id     TEXT PRIMARY KEY,
            visibility  TEXT NOT NULL CHECK(visibility IN ('public', 'private')) DEFAULT 'private',
            updated_at  INTEGER NOT NULL
        );
    `);

    const cols = db.prepare('PRAGMA table_info(gif_history)').all() as { name: string }[];
    if (!cols.some((c) => c.name === 'message_id')) {
        db.exec('ALTER TABLE gif_history ADD COLUMN message_id TEXT');
    }
    db.exec('CREATE INDEX IF NOT EXISTS idx_history_message ON gif_history(message_id)');
};

export const purgeOldHistory = (db: DB, olderThanMs: number = ONE_YEAR_MS): number => {
    const threshold = Date.now() - olderThanMs;
    return db.prepare('DELETE FROM gif_history WHERE created_at < ?').run(threshold).changes;
};
