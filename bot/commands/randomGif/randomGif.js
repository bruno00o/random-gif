const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('random-gif')
        .setDescription('Replies with a random Gif!')
        .addStringOption(option => option.setName('word').setDescription('The word to search for'))
        .setDMPermission(true),
    async execute(interaction) {
        const word = interaction.options.getString('word');
        const url = 'http://localhost:8080/random-gif/' + (word ? `${word}` : '');
        console.log(url);
        const { data } = await axios.get(url);
        await interaction.reply(data.gif);
    },
};