
if (typeof (PhusionPassenger) !== 'undefined') {
    PhusionPassenger.configure({ autoInstall: false });
}

const app = require('./api/api');
const refreshSlashCommands = require('./bot/refresh');
const client = require('./bot/bot');
const cron = require('node-cron');
const axios = require('axios');

const { token } = require('./config.json');

const runAPI = (port = 8080) => {
    if (typeof (PhusionPassenger) !== 'undefined') {
        app.listen('passenger');
    } else {
        app.listen(port, () => {
            console.log(`API running on port ${port}`);
        });
    }
}

/* test to keep bot alive */
const keepAlive = () => {
    cron.schedule('*/5 * * * *', async () => {
        await axios.get(process.env.URL_API);
    });
}

(async () => {
    await refreshSlashCommands();
    client.login(token);
    runAPI();
    keepAlive();
})();