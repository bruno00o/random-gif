import { ButtonInteraction, Events, Interaction, ModalSubmitInteraction } from 'discord.js';
import type { BotClient } from '../bot.js';

export const name = Events.InteractionCreate;

const dispatchComponent = async (interaction: ButtonInteraction | ModalSubmitInteraction) => {
    const [commandName] = interaction.customId.split(':');
    const client = interaction.client as BotClient;
    const command = client.commands.get(commandName);

    try {
        const handling = interaction.isButton()
            ? command?.handleButton?.(interaction)
            : command?.handleModal?.(interaction);

        if (!handling) {
            console.error(`No handler matching ${interaction.customId} was found.`);
            return;
        }

        await handling;
    } catch (error) {
        console.error(`Error handling ${interaction.customId}`);
        console.error(error);
    }
};

export const execute = async (interaction: Interaction) => {
    if (interaction.isButton() || interaction.isModalSubmit()) return dispatchComponent(interaction);
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
