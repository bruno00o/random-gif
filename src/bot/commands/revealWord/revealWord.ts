import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    InteractionContextType,
    MessageContextMenuCommandInteraction,
    MessageFlags,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { getByMessageId } from '../../../db/history.js';
import { getVisibility } from '../../../db/preferences.js';

export const data = new ContextMenuCommandBuilder()
    .setName('Reveal word')
    .setType(ApplicationCommandType.Message)
    .setContexts([
        InteractionContextType.BotDM,
        InteractionContextType.Guild,
        InteractionContextType.PrivateChannel,
    ])
    .setIntegrationTypes([
        ApplicationIntegrationType.GuildInstall,
        ApplicationIntegrationType.UserInstall,
    ]);

export const execute = async (interaction: MessageContextMenuCommandInteraction) => {
    const { db } = interaction.client as BotClient;
    const target = interaction.targetMessage;

    if (target.author.id !== interaction.client.user?.id) {
        return interaction.reply({
            content: '❌ This is not a random-gif message.',
            flags: MessageFlags.Ephemeral,
        });
    }

    const entry = getByMessageId(db, target.id);
    if (!entry) {
        return interaction.reply({
            content: '❓ No word found for this GIF (probably posted before history tracking).',
            flags: MessageFlags.Ephemeral,
        });
    }

    const isSelf = entry.user_id === interaction.user.id;
    if (!isSelf && getVisibility(db, entry.user_id) === 'private') {
        return interaction.reply({
            content: '🔒 The searcher keeps their words private.',
            flags: MessageFlags.Ephemeral,
        });
    }

    const verb = entry.word_source === 'user' ? 'searched for' : 'got a random';
    return interaction.reply({
        content: `🔍 <@${entry.user_id}> ${verb} **${entry.word}**`,
        flags: MessageFlags.Ephemeral,
    });
};
