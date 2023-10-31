const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    cooldown: 1,
    data: new SlashCommandBuilder()
        .setName('random-gif')
        .setDescription('Replies with a random Gif!')
        .addStringOption(option => option.setName('request').setDescription('Request to search on Tenor').setRequired(false))
        .addStringOption(option => option.setName('locale').setDescription('Locale of the request to search on Tenor').setRequired(false))
        .addStringOption(option => option.setName('number-of-results').setDescription('Number of results to search on Tenor (for randomization)').setRequired(false))
        .setDMPermission(true),
    async execute(interaction) {
        const word = interaction.options.getString('request');
        const request = encodeURIComponent(word);

        const locale = interaction.options.getString('locale');
        const numberOfResults = interaction.options.getString('number-of-results');


        const url = new URL(`${process.env.URL_API}/random-gif`);
        word ? url.searchParams.append('request', request) : '';
        locale ? url.searchParams.append('locale', locale) : '';
        numberOfResults ? url.searchParams.append('numberOfResults', numberOfResults) : '';

        const { data } = await axios.get(url.href);

        await interaction.reply(data.gif);
    },
};