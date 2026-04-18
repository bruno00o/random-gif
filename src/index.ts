import 'dotenv/config';
import { serve } from '@hono/node-server';
import { app } from './api/api.js';
import { createBot } from './bot/bot.js';
import { refreshSlashCommands } from './bot/refresh.js';

const PORT = Number(process.env.PORT ?? 8080);

const main = async () => {
    await refreshSlashCommands();

    const client = await createBot();
    await client.login(process.env.BOT_TOKEN);

    serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
        console.log(`API running on port ${info.port}`);
    });
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
