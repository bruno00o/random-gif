const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    cooldown: 1,
    data: new SlashCommandBuilder()
        .setName('random-gif')
        .setDescription('Replies with a random Gif!')
        .addStringOption(option => option.setName('request').setDescription('Request to search on Tenor').setRequired(false))
        .addStringOption(option => option.setName('locale').setDescription('Locale of the request to search on Tenor').setRequired(false))
        .addStringOption(option => option.setName('number-of-results').setDescription('Number of results to search on Tenor (for randomization)').setRequired(false))
        .setContexts(['BotDM', 'Guild', 'PrivateChannel'])
        .setIntegrationTypes(['GuildInstall', 'UserInstall']),
    async execute(interaction) {
        const word = interaction.options.getString('request');
        const request = encodeURIComponent(word);

        const locale = interaction.options.getString('locale');
        const numberOfResults = interaction.options.getString('number-of-results');

        const url = new URL(`${process.env.URL_API}/random-gif`);
        word ? url.searchParams.append('request', request) : '';
        locale ? url.searchParams.append('locale', locale) : '';
        numberOfResults ? url.searchParams.append('numberOfResults', numberOfResults) : '';

        const response = await fetch(url.href);
        const data = await response.json();

        await interaction.reply(data.gif);
    },
};