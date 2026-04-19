import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { getUserHistory } from '../../../db/history.js';
import { getVisibility } from '../../../db/preferences.js';

const HISTORY_LIMIT = 10;

export const data = new SlashCommandBuilder()
    .setName('history')
    .setDescription('Show your recent random-gif history (last 10)')
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription('Show another user\'s history (only if they made it public)')
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
            content: `🔒 ${target.username} keeps their history private.`,
            flags: MessageFlags.Ephemeral,
        });
    }

    const history = getUserHistory(db, target.id, HISTORY_LIMIT);

    if (history.length === 0) {
        return interaction.reply({
            content: isSelf
                ? '📭 You have no history yet. Try `/random-gif`!'
                : `📭 ${target.username} has no history yet.`,
            flags: MessageFlags.Ephemeral,
        });
    }

    const lines = history.map((h) => {
        const when = `<t:${Math.floor(h.created_at / 1000)}:R>`;
        const source = h.word_source === 'user' ? '📝' : '🎲';
        return `${source} **${h.word}** (${h.locale}) · ${when}\n${h.gif_url}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`🕑 ${isSelf ? 'Your' : `${target.username}'s`} recent GIFs`)
        .setDescription(lines.join('\n\n'))
        .setColor(0x5865f2)
        .setFooter({ text: '📝 = searched · 🎲 = random' });

    return interaction.reply({
        embeds: [embed],
        flags: isSelf ? MessageFlags.Ephemeral : undefined,
    });
};
