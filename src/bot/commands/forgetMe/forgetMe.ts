import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { forgetUser } from '../../../db/history.js';

export const data = new SlashCommandBuilder()
    .setName('forget-me')
    .setDescription('Delete all your random-gif data (history + privacy preferences)')
    .setContexts([
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel,
    ])
    .setIntegrationTypes([
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall,
    ]);

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const { db } = interaction.client as BotClient;
    const { history, preferences } = forgetUser(db, interaction.user.id);

    const total = history + preferences;
    const msg =
        total === 0
            ? '✨ Nothing to forget — you had no data stored.'
            : `🧹 Deleted **${history}** history entries and **${preferences}** preference${preferences === 1 ? '' : 's'}. You are forgotten.`;

    return interaction.reply({ content: msg, flags: MessageFlags.Ephemeral });
};
