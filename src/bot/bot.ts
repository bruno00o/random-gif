import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
    ChatInputCommandInteraction,
    Client,
    Collection,
    GatewayIntentBits,
    SlashCommandBuilder,
} from 'discord.js';

export type BotCommand = {
    data: SlashCommandBuilder;
    execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
    cooldown?: number;
};

export type BotClient = Client & { commands: Collection<string, BotCommand> };

type BotEvent = {
    name: string;
    once?: boolean;
    execute: (...args: unknown[]) => unknown;
};

const __dirname = dirname(fileURLToPath(import.meta.url));

const importModule = async <T>(path: string): Promise<T> =>
    (await import(pathToFileURL(path).href)) as T;

export const loadCommands = async (): Promise<Collection<string, BotCommand>> => {
    const commands = new Collection<string, BotCommand>();
    const foldersPath = join(__dirname, 'commands');
    const folders = await readdir(foldersPath);

    for (const folder of folders) {
        const commandsPath = join(foldersPath, folder);
        const files = (await readdir(commandsPath)).filter((f) => f.endsWith('.js'));
        for (const file of files) {
            const command = await importModule<BotCommand>(join(commandsPath, file));
            if ('data' in command && 'execute' in command) {
                commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] Command ${file} is missing "data" or "execute".`);
            }
        }
    }

    return commands;
};

const loadEvents = async (client: Client): Promise<void> => {
    const eventsPath = join(__dirname, 'events');
    const files = (await readdir(eventsPath)).filter((f) => f.endsWith('.js'));

    for (const file of files) {
        const event = await importModule<BotEvent>(join(eventsPath, file));
        const handler = (...args: unknown[]) => event.execute(...args);
        if (event.once) client.once(event.name, handler);
        else client.on(event.name, handler);
    }
};

export const createBot = async (): Promise<BotClient> => {
    const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
    }) as BotClient;

    client.commands = await loadCommands();
    await loadEvents(client);

    return client;
};
