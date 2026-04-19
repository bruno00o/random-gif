import type { DB } from './db.js';

export type Visibility = 'public' | 'private';

export const getVisibility = (db: DB, user_id: string): Visibility => {
    const row = db
        .prepare('SELECT visibility FROM user_preferences WHERE user_id = ?')
        .get(user_id) as { visibility: Visibility } | undefined;
    return row?.visibility ?? 'private';
};

export const setVisibility = (db: DB, user_id: string, visibility: Visibility): void => {
    db.prepare(
        `INSERT INTO user_preferences (user_id, visibility, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
            visibility = excluded.visibility,
            updated_at = excluded.updated_at`,
    ).run(user_id, visibility, Date.now());
};
