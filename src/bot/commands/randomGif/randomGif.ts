import {
    ApplicationIntegrationType,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';

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

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const word = interaction.options.getString('search');
    const locale = interaction.options.getString('locale');
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
    if (word) url.searchParams.append('request', encodeURIComponent(word));
    if (locale) url.searchParams.append('locale', locale);
    if (limit) url.searchParams.append('numberOfResults', limit);

    const response = await fetch(url.href);
    const data = (await response.json()) as { gif: string };

    await interaction.reply(data.gif);
};
