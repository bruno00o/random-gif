import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type DB } from './db.js';
import { getVisibility, setVisibility } from './preferences.js';

describe('preferences', () => {
    let db: DB;

    beforeEach(() => {
        db = openDatabase(':memory:');
    });

    it('defaults to private for unknown users', () => {
        expect(getVisibility(db, 'unknown')).toBe('private');
    });

    it('persists a set visibility', () => {
        setVisibility(db, 'u1', 'public');
        expect(getVisibility(db, 'u1')).toBe('public');
    });

    it('upserts — setting twice overwrites, no UNIQUE error', () => {
        setVisibility(db, 'u1', 'public');
        setVisibility(db, 'u1', 'private');
        expect(getVisibility(db, 'u1')).toBe('private');
    });
});
