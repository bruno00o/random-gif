const app = require('./api/api');
const refreshSlashCommands = require('./bot/refresh');
const client = require('./bot/bot');
require('dotenv').config();

const token = process.env.BOT_TOKEN;

const runAPI = (port = 8080) => {
    if (typeof (PhusionPassenger) !== 'undefined') {
        app.listen('passenger');
    } else {
        app.listen(port, () => {
            console.log(`API running on port ${port}`);
        });
    }
}

(async () => {
    await refreshSlashCommands();
    client.login(token);
    runAPI();
})();