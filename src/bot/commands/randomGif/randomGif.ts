import {
    ActionRowBuilder,
    ApplicationIntegrationType,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { getByMessageId, recordGif, updateGifUrl } from '../../../db/history.js';
import { fetchGif } from '../../fetchGif.js';
import { en, fr, messagesFor, type Messages } from '../../i18n.js';

export const data = new SlashCommandBuilder()
    .setName('random-gif')
    .setDescription(en.randomGif.description)
    .setDescriptionLocalizations({ fr: fr.randomGif.description })
    .addStringOption((option) =>
        option
            .setName('search')
            .setDescription(en.randomGif.searchOption)
            .setDescriptionLocalizations({ fr: fr.randomGif.searchOption })
            .setRequired(false),
    )
    .addStringOption((option) =>
        option
            .setName('locale')
            .setDescription(en.randomGif.localeOption)
            .setDescriptionLocalizations({ fr: fr.randomGif.localeOption })
            .setRequired(false),
    )
    .addStringOption((option) =>
        option
            .setName('limit')
            .setDescription(en.randomGif.limitOption)
            .setDescriptionLocalizations({ fr: fr.randomGif.limitOption })
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

export const cooldown = 1;

const REROLL_POOL_SIZE = '50';

const rerollRow = (t: Messages['randomGif']) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`${data.name}:reroll`)
            .setLabel(t.reroll)
            .setStyle(ButtonStyle.Secondary),
    );

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const search = interaction.options.getString('search');
    const localeOpt = interaction.options.getString('locale');
    const limit = interaction.options.getString('limit');
    const t = messagesFor(interaction.locale).randomGif;

    if (limit) {
        const limitNumber = Number.parseInt(limit, 10);
        if (Number.isNaN(limitNumber) || limitNumber > 50 || limitNumber < 1) {
            return interaction.reply({
                content: t.limitRange,
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    await interaction.deferReply();

    const data = await fetchGif(search, localeOpt, limit);
    if (!data) {
        await interaction.deleteReply();
        return interaction.followUp({
            content: t.noGif,
            flags: MessageFlags.Ephemeral,
        });
    }

    const message = await interaction.editReply({
        content: data.gif,
        components: [rerollRow(t)],
    });

    try {
        const { db } = interaction.client as BotClient;
        recordGif(db, {
            user_id: interaction.user.id,
            guild_id: interaction.guildId,
            word: data.word,
            word_source: search ? 'user' : 'random',
            gif_url: data.gif,
            locale: data.locale,
            message_id: message.id,
        });
    } catch (err) {
        console.error('Failed to record gif history:', err);
    }
};

export const handleButton = async (interaction: ButtonInteraction) => {
    const { db } = interaction.client as BotClient;
    const entry = getByMessageId(db, interaction.message.id);
    const t = messagesFor(interaction.locale).randomGif;

    if (!entry) {
        return interaction.reply({
            content: t.rerollGone,
            flags: MessageFlags.Ephemeral,
        });
    }

    if (entry.user_id !== interaction.user.id) {
        return interaction.reply({
            content: t.rerollForbidden,
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.deferUpdate();

    const gif = await fetchGif(entry.word, entry.locale, REROLL_POOL_SIZE);
    if (!gif) {
        return interaction.followUp({
            content: t.noGif,
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.editReply({ content: gif.gif, components: [rerollRow(t)] });
    updateGifUrl(db, interaction.message.id, gif.gif);
};
