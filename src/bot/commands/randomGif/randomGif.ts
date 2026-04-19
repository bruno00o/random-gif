import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import type { BotClient } from '../../bot.js';
import { recordGif } from '../../../db/history.js';

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

    const url = new URL(`${process.env.URL_API}/random-gif`);
    if (search) url.searchParams.append('request', encodeURIComponent(search));
    if (localeOpt) url.searchParams.append('locale', localeOpt);
    if (limit) url.searchParams.append('numberOfResults', limit);

    const response = await fetch(url.href);
    if (!response.ok) {
        return interaction.reply({
            content: '❌ Could not find a GIF for that word. Try another one!',
            flags: MessageFlags.Ephemeral,
        });
    }
    const data = (await response.json()) as ApiResponse;

    await interaction.reply(data.gif);

    try {
        const { db } = interaction.client as BotClient;
        recordGif(db, {
            user_id: interaction.user.id,
            guild_id: interaction.guildId,
            word: data.word,
            word_source: search ? 'user' : 'random',
            gif_url: data.gif,
            locale: data.locale,
        });
    } catch (err) {
        console.error('Failed to record gif history:', err);
    }
};
