import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, ONE_YEAR_MS, type DB } from './db.js';
import {
    createGame,
    getGame,
    getLeaderboard,
    giveUpGame,
    purgeOldGames,
    revealLetter,
    winGame,
} from './guess.js';
import { forgetUser } from './history.js';

const start = (db: DB, message_id = 'm1', guild_id: string | null = 'g1', word = 'cat') => {
    createGame(db, { message_id, word, user_id: 'starter', guild_id, gif_url: 'https://x/c.gif' });
    return getGame(db, message_id)!;
};

describe('guess', () => {
    let db: DB;

    beforeEach(() => {
        db = openDatabase(':memory:');
    });

    it('starts a game open with no letter revealed', () => {
        expect(start(db)).toMatchObject({ status: 'open', revealed: 0, winner_id: null });
    });

    it('never reveals the whole word', () => {
        start(db);
        for (let i = 0; i < 5; i++) revealLetter(db, 'm1');
        expect(getGame(db, 'm1')?.revealed).toBe(2);
    });

    it('lets only the first correct answer win', () => {
        const game = start(db);

        expect(winGame(db, game, 'alice', 3)).toBe(true);
        expect(winGame(db, game, 'bob', 3)).toBe(false);

        expect(getGame(db, 'm1')).toMatchObject({ status: 'won', winner_id: 'alice' });
        expect(getLeaderboard(db, 'g1')).toEqual([{ user_id: 'alice', points: 3, wins: 1 }]);
    });

    it('adds up points per server and ranks by points', () => {
        winGame(db, start(db, 'm1'), 'alice', 1);
        winGame(db, start(db, 'm2'), 'bob', 3);
        winGame(db, start(db, 'm3'), 'alice', 1);
        winGame(db, start(db, 'm4', 'g2'), 'alice', 3);

        expect(getLeaderboard(db, 'g1')).toEqual([
            { user_id: 'bob', points: 3, wins: 1 },
            { user_id: 'alice', points: 2, wins: 2 },
        ]);
        expect(getLeaderboard(db, 'g2')).toEqual([{ user_id: 'alice', points: 3, wins: 1 }]);
    });

    it('wins without any score outside a server', () => {
        expect(winGame(db, start(db, 'm1', null), 'alice', 3)).toBe(true);
        expect(db.prepare('SELECT COUNT(*) AS n FROM guess_scores').get()).toEqual({ n: 0 });
    });

    it('closes a given-up game once', () => {
        const game = start(db);

        expect(giveUpGame(db, 'm1')).toBe(true);
        expect(giveUpGame(db, 'm1')).toBe(false);
        expect(winGame(db, game, 'alice', 3)).toBe(false);
    });

    it('purges only games older than the retention window', () => {
        start(db, 'old');
        start(db, 'recent');
        db.prepare('UPDATE guess_games SET created_at = ? WHERE message_id = ?').run(
            Date.now() - ONE_YEAR_MS - 1000,
            'old',
        );

        expect(purgeOldGames(db)).toBe(1);
        expect(getGame(db, 'old')).toBeNull();
        expect(getGame(db, 'recent')).not.toBeNull();
    });

    it('forgets the games and scores of a user', () => {
        winGame(db, start(db, 'won'), 'alice', 3);
        createGame(db, {
            message_id: 'started',
            word: 'dog',
            user_id: 'alice',
            guild_id: 'g1',
            gif_url: 'https://x/d.gif',
        });
        start(db, 'unrelated');

        expect(forgetUser(db, 'alice').games).toBe(3);

        expect(getGame(db, 'won')).toBeNull();
        expect(getGame(db, 'started')).toBeNull();
        expect(getGame(db, 'unrelated')).not.toBeNull();
        expect(getLeaderboard(db, 'g1')).toEqual([]);
    });
});
