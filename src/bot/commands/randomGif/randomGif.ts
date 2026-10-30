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

export const data = new SlashCommandBuilder()
    .setName('random-gif')
    .setDescription('Replies with a random Gif!')
    .addStringOption((option) =>
        option
            .setName('search')
            .setDescription('What kind of GIF are you looking for?')
            .setRequired(false),
    )
    .addStringOption((option) =>
        option
            .setName('locale')
            .setDescription('Set the region for GIF search (e.g., US, FR, JP)')
            .setRequired(false),
    )
    .addStringOption((option) =>
        option
            .setName('limit')
            .setDescription('How many GIFs to pick from (1-50)')
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

type ApiResponse = {
    word: string;
    gif: string;
    locale: string;
    numberOfResults: number;
};

const REROLL_POOL_SIZE = '50';
const NO_GIF_MESSAGE = '❌ Could not find a GIF for that word. Try another one!';

const rerollRow = () =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`${data.name}:reroll`)
            .setLabel('Reroll')
            .setStyle(ButtonStyle.Secondary),
    );

const fetchGif = async (
    search: string | null,
    locale: string | null,
    limit: string | null,
): Promise<ApiResponse | null> => {
    const url = new URL(`${process.env.URL_API}/random-gif`);
    if (search) url.searchParams.append('request', encodeURIComponent(search));
    if (locale) url.searchParams.append('locale', locale);
    if (limit) url.searchParams.append('numberOfResults', limit);

    try {
        const response = await fetch(url.href);
        if (!response.ok) return null;
        return (await response.json()) as ApiResponse;
    } catch (err) {
        console.error('Failed to fetch gif:', err);
        return null;
    }
};

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const search = interaction.options.getString('search');
    const localeOpt = interaction.options.getString('locale');
    const limit = interaction.options.getString('limit');

    if (limit) {
        const limitNumber = Number.parseInt(limit, 10);
        if (Number.isNaN(limitNumber) || limitNumber > 50 || limitNumber < 1) {
            return interaction.reply({
                content: '❌ The limit must be a number between 1 and 50!',
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    await interaction.deferReply();

    const data = await fetchGif(search, localeOpt, limit);
    if (!data) {
        await interaction.deleteReply();
        return interaction.followUp({
            content: NO_GIF_MESSAGE,
            flags: MessageFlags.Ephemeral,
        });
    }

    const message = await interaction.editReply({
        content: data.gif,
        components: [rerollRow()],
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

    if (!entry) {
        return interaction.reply({
            content: 'This GIF can no longer be rerolled.',
            flags: MessageFlags.Ephemeral,
        });
    }

    if (entry.user_id !== interaction.user.id) {
        return interaction.reply({
            content: 'Only the person who asked for this GIF can reroll it.',
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.deferUpdate();

    const gif = await fetchGif(entry.word, entry.locale, REROLL_POOL_SIZE);
    if (!gif) {
        return interaction.followUp({
            content: NO_GIF_MESSAGE,
            flags: MessageFlags.Ephemeral,
        });
    }

    await interaction.editReply({ content: gif.gif, components: [rerollRow()] });
    updateGifUrl(db, interaction.message.id, gif.gif);
};
