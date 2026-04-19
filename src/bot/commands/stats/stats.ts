import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { getUserStats } from '../../../db/history.js';
import { getVisibility } from '../../../db/preferences.js';

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show your random-gif stats')
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription('Show another user\'s stats (only if they made it public)')
            .setRequired(false),
    )
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
    const target = interaction.options.getUser('user') ?? interaction.user;
    const { db } = interaction.client as BotClient;
    const isSelf = target.id === interaction.user.id;

    if (!isSelf && getVisibility(db, target.id) === 'private') {
        return interaction.reply({
            content: `🔒 ${target.username} keeps their stats private.`,
            flags: MessageFlags.Ephemeral,
        });
    }

    const stats = getUserStats(db, target.id);

    if (stats.total === 0) {
        return interaction.reply({
            content: isSelf
                ? '📭 You have no stats yet. Try `/random-gif`!'
                : `📭 ${target.username} has no stats yet.`,
            flags: MessageFlags.Ephemeral,
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(`📊 ${isSelf ? 'Your' : `${target.username}'s`} stats`)
        .setColor(0x5865f2)
        .addFields(
            { name: 'Total GIFs', value: `${stats.total}`, inline: true },
            { name: '📝 Searched', value: `${stats.userWords}`, inline: true },
            { name: '🎲 Random', value: `${stats.randomWords}`, inline: true },
        );

    if (stats.topWord) {
        embed.addFields({
            name: '🔥 Most searched word',
            value: `**${stats.topWord.word}** (${stats.topWord.count}×)`,
        });
    }

    return interaction.reply({
        embeds: [embed],
        flags: isSelf ? MessageFlags.Ephemeral : undefined,
    });
};
