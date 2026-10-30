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
import { en, fr, messagesFor } from '../../i18n.js';

export const data = new SlashCommandBuilder()
    .setName('stats')
    .setDescription(en.stats.description)
    .setDescriptionLocalizations({ fr: fr.stats.description })
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription(en.stats.userOption)
            .setDescriptionLocalizations({ fr: fr.stats.userOption })
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
    const t = messagesFor(interaction.locale).stats;

    if (!isSelf && getVisibility(db, target.id) === 'private') {
        return interaction.reply({
            content: t.private(target.username),
            flags: MessageFlags.Ephemeral,
        });
    }

    const stats = getUserStats(db, target.id);

    if (stats.total === 0) {
        return interaction.reply({
            content: isSelf ? t.emptySelf : t.empty(target.username),
            flags: MessageFlags.Ephemeral,
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(isSelf ? t.titleSelf : t.title(target.username))
        .setColor(0x5865f2)
        .addFields(
            { name: t.total, value: `${stats.total}`, inline: true },
            { name: t.searched, value: `${stats.userWords}`, inline: true },
            { name: t.random, value: `${stats.randomWords}`, inline: true },
        );

    if (stats.topWord) {
        embed.addFields({
            name: t.topWord,
            value: t.topWordValue(stats.topWord.word, stats.topWord.count),
        });
    }

    return interaction.reply({
        embeds: [embed],
        flags: isSelf ? MessageFlags.Ephemeral : undefined,
    });
};
