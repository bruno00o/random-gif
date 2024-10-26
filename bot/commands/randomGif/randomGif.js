const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    cooldown: 1,
    data: new SlashCommandBuilder()
        .setName('random-gif')
        .setDescription('Replies with a random Gif!')
        .addStringOption(option => 
            option.setName('search')
                .setDescription('What kind of GIF are you looking for?')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('locale')
                .setDescription('Set the region for GIF search (e.g., US, FR, JP)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('limit')
                .setDescription('How many GIFs to pick from (1-50)')
                .setRequired(false))
        .setContexts(['BotDM', 'Guild', 'PrivateChannel'])
        .setIntegrationTypes(['GuildInstall', 'UserInstall']),
    async execute(interaction) {
        const word = interaction.options.getString('search');
        const locale = interaction.options.getString('locale');
        const limit = interaction.options.getString('limit');

        if (limit) {
            const limitNumber = parseInt(limit);
            if (isNaN(limitNumber) || limitNumber > 50 || limitNumber < 1) {
                return await interaction.reply({ 
                    content: '❌ The limit must be a number between 1 and 50!',
                    ephemeral: true
                });
            }
        }

        const request = encodeURIComponent(word);
        const url = new URL(`${process.env.URL_API}/random-gif`);
        
        word ? url.searchParams.append('request', request) : '';
        locale ? url.searchParams.append('locale', locale) : '';
        limit ? url.searchParams.append('numberOfResults', limit) : '';

        const response = await fetch(url.href);
        const data = await response.json();

        await interaction.reply(data.gif);
    },
};