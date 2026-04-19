import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type DB } from './db.js';
import {
    forgetUser,
    getByMessageId,
    getUserHistory,
    getUserStats,
    recordGif,
} from './history.js';
import { setVisibility } from './preferences.js';

describe('history', () => {
    let db: DB;

    beforeEach(() => {
        db = openDatabase(':memory:');
    });

    describe('recordGif + getUserHistory', () => {
        it('returns entries in reverse chronological order, newest first', () => {
            recordGif(db, {
                user_id: 'u1',
                guild_id: 'g1',
                word: 'cat',
                word_source: 'user',
                gif_url: 'https://x/cat.gif',
                locale: 'US',
                created_at: 1000,
            });
            recordGif(db, {
                user_id: 'u1',
                guild_id: 'g1',
                word: 'dog',
                word_source: 'random',
                gif_url: 'https://x/dog.gif',
                locale: 'FR',
                created_at: 2000,
            });

            const history = getUserHistory(db, 'u1');
            expect(history.map((h) => h.word)).toEqual(['dog', 'cat']);
        });

        it('respects the limit argument', () => {
            for (let i = 0; i < 15; i++) {
                recordGif(db, {
                    user_id: 'u1',
                    guild_id: null,
                    word: `w${i}`,
                    word_source: 'random',
                    gif_url: 'https://x/w.gif',
                    locale: 'US',
                    created_at: i,
                });
            }
            expect(getUserHistory(db, 'u1', 5)).toHaveLength(5);
        });

        it('scopes by user_id', () => {
            recordGif(db, {
                user_id: 'u1',
                guild_id: null,
                word: 'mine',
                word_source: 'user',
                gif_url: 'https://x/m.gif',
                locale: 'US',
            });
            recordGif(db, {
                user_id: 'u2',
                guild_id: null,
                word: 'theirs',
                word_source: 'user',
                gif_url: 'https://x/t.gif',
                locale: 'US',
            });

            expect(getUserHistory(db, 'u1').map((h) => h.word)).toEqual(['mine']);
        });
    });

    describe('getUserStats', () => {
        it('returns zero stats for unknown user', () => {
            const stats = getUserStats(db, 'nobody');
            expect(stats).toEqual({ total: 0, topWord: null, userWords: 0, randomWords: 0 });
        });

        it('computes total, top word, and breakdown by source', () => {
            for (const word of ['cat', 'cat', 'dog']) {
                recordGif(db, {
                    user_id: 'u1',
                    guild_id: null,
                    word,
                    word_source: 'user',
                    gif_url: 'https://x/g.gif',
                    locale: 'US',
                });
            }
            recordGif(db, {
                user_id: 'u1',
                guild_id: null,
                word: 'bird',
                word_source: 'random',
                gif_url: 'https://x/b.gif',
                locale: 'US',
            });

            const stats = getUserStats(db, 'u1');
            expect(stats.total).toBe(4);
            expect(stats.topWord).toEqual({ word: 'cat', count: 2 });
            expect(stats.userWords).toBe(3);
            expect(stats.randomWords).toBe(1);
        });
    });

    describe('getByMessageId', () => {
        it('returns null when no entry matches the message id', () => {
            expect(getByMessageId(db, 'missing')).toBeNull();
        });

        it('returns the entry with the given message_id', () => {
            recordGif(db, {
                user_id: 'u1',
                guild_id: null,
                word: 'cat',
                word_source: 'user',
                gif_url: 'https://x/cat.gif',
                locale: 'US',
                message_id: 'msg-42',
            });
            const entry = getByMessageId(db, 'msg-42');
            expect(entry?.word).toBe('cat');
            expect(entry?.message_id).toBe('msg-42');
        });
    });

    describe('forgetUser', () => {
        it('removes both history and preferences for the user', () => {
            recordGif(db, {
                user_id: 'u1',
                guild_id: null,
                word: 'a',
                word_source: 'user',
                gif_url: 'https://x/a.gif',
                locale: 'US',
            });
            recordGif(db, {
                user_id: 'u1',
                guild_id: null,
                word: 'b',
                word_source: 'user',
                gif_url: 'https://x/b.gif',
                locale: 'US',
            });
            setVisibility(db, 'u1', 'public');
            // noise — another user whose data should survive
            recordGif(db, {
                user_id: 'u2',
                guild_id: null,
                word: 'z',
                word_source: 'user',
                gif_url: 'https://x/z.gif',
                locale: 'US',
            });

            const result = forgetUser(db, 'u1');
            expect(result).toEqual({ history: 2, preferences: 1 });

            expect(getUserHistory(db, 'u1')).toHaveLength(0);
            expect(getUserHistory(db, 'u2')).toHaveLength(1);
        });
    });
});
