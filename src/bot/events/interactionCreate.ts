import { ButtonInteraction, Events, Interaction } from 'discord.js';
import type { BotClient } from '../bot.js';

export const name = Events.InteractionCreate;

const dispatchButton = async (interaction: ButtonInteraction) => {
    const [commandName] = interaction.customId.split(':');
    const client = interaction.client as BotClient;
    const command = client.commands.get(commandName);

    if (!command?.handleButton) {
        console.error(`No button handler matching ${interaction.customId} was found.`);
        return;
    }

    try {
        await command.handleButton(interaction);
    } catch (error) {
        console.error(`Error handling button ${interaction.customId}`);
        console.error(error);
    }
};

export const execute = async (interaction: Interaction) => {
    if (interaction.isButton()) return dispatchButton(interaction);
    if (!interaction.isChatInputCommand() && !interaction.isMessageContextMenuCommand()) return;

    const client = interaction.client as BotClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
    }
};
