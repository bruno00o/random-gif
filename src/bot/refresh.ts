import { REST, Routes } from 'discord.js';
import { loadCommands } from './bot.js';

export const refreshSlashCommands = async (): Promise<void> => {
    const clientId = process.env.CLIENT_ID;
    const token = process.env.BOT_TOKEN;

    if (!clientId || !token) {
        throw new Error('CLIENT_ID and BOT_TOKEN must be set');
    }

    const commands = (await loadCommands()).map((cmd) => cmd.data.toJSON());
    const rest = new REST().setToken(token);

    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = (await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
    })) as unknown[];
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
};
