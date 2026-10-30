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
import { en, fr, messagesFor } from '../../i18n.js';

const HISTORY_LIMIT = 10;

export const data = new SlashCommandBuilder()
    .setName('history')
    .setDescription(en.history.description)
    .setDescriptionLocalizations({ fr: fr.history.description })
    .addUserOption((option) =>
        option
            .setName('user')
            .setDescription(en.history.userOption)
            .setDescriptionLocalizations({ fr: fr.history.userOption })
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
    const t = messagesFor(interaction.locale).history;

    if (!isSelf && getVisibility(db, target.id) === 'private') {
        return interaction.reply({
            content: t.private(target.username),
            flags: MessageFlags.Ephemeral,
        });
    }

    const history = getUserHistory(db, target.id, HISTORY_LIMIT);

    if (history.length === 0) {
        return interaction.reply({
            content: isSelf ? t.emptySelf : t.empty(target.username),
            flags: MessageFlags.Ephemeral,
        });
    }

    const lines = history.map((h) => {
        const when = `<t:${Math.floor(h.created_at / 1000)}:R>`;
        const entry = h.word_source === 'user' ? t.searched : t.random;
        return `${entry(h.word, h.locale, when)}\n${h.gif_url}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(isSelf ? t.titleSelf : t.title(target.username))
        .setDescription(lines.join('\n\n'))
        .setColor(0x5865f2);

    return interaction.reply({
        embeds: [embed],
        flags: isSelf ? MessageFlags.Ephemeral : undefined,
    });
};
