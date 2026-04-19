import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from './api/api.js';
import { createBot } from './bot/bot.js';
import { refreshSlashCommands } from './bot/refresh.js';
import { openDatabase, purgeOldHistory } from './db/db.js';

const PORT = Number(process.env.PORT ?? 8080);
const DATABASE_PATH = process.env.DATABASE_PATH ?? './data/random-gif.db';

const main = async () => {
    const db = openDatabase(DATABASE_PATH);
    const purged = purgeOldHistory(db);
    if (purged > 0) console.log(`Purged ${purged} history entries older than 1 year`);

    await refreshSlashCommands();

    const client = await createBot(db);
    await client.login(process.env.BOT_TOKEN);

    serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
        console.log(`API running on port ${info.port}`);
    });
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
