import { describe, expect, it } from 'vitest';
import { ONE_YEAR_MS, openDatabase, purgeOldHistory } from './db.js';
import { recordGif } from './history.js';

describe('openDatabase', () => {
    it('creates tables and indexes for a fresh in-memory db', () => {
        const db = openDatabase(':memory:');

        const tables = db
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .all() as { name: string }[];
        const names = tables.map((t) => t.name);

        expect(names).toContain('gif_history');
        expect(names).toContain('user_preferences');
    });

    it('is idempotent — calling openDatabase twice does not throw', () => {
        const db = openDatabase(':memory:');
        expect(() => openDatabase(':memory:')).not.toThrow();
        db.close();
    });
});

describe('purgeOldHistory', () => {
    it('removes rows older than the cutoff', () => {
        const db = openDatabase(':memory:');
        const now = Date.now();

        recordGif(db, {
            user_id: 'u1',
            guild_id: null,
            word: 'old',
            word_source: 'random',
            gif_url: 'https://x/old.gif',
            locale: 'US',
            created_at: now - ONE_YEAR_MS - 1000,
        });
        recordGif(db, {
            user_id: 'u1',
            guild_id: null,
            word: 'recent',
            word_source: 'random',
            gif_url: 'https://x/recent.gif',
            locale: 'US',
            created_at: now,
        });

        const purged = purgeOldHistory(db);
        expect(purged).toBe(1);

        const remaining = db.prepare('SELECT word FROM gif_history').all() as { word: string }[];
        expect(remaining.map((r) => r.word)).toEqual(['recent']);
    });
});
