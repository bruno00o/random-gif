const express = require('express');
const router = express.Router();
const axios = require('axios');
const env = require('dotenv').config();

const tenorUrl = "https://tenor.googleapis.com/v2/search?"
const tenorKey = process.env.TENOR_KEY;

const getGif = async (word, locale = 'US', numberOfResults = 10) => {
    const url = `${tenorUrl}key=${tenorKey}&q=${word}&limit=${numberOfResults}&media_filter=gif&locale=${locale}`;

    const response = await axios.get(url);
    const data = response.data;
    const gif = data.results[Math.floor(Math.random() * numberOfResults)].media_formats.gif.url;

    return gif;
};

/**
 * @swagger
 *  /random-gif/:
 *  get:
 *     description: Récupère un mot aléatoire et son GIF associé
 *     tags:
 *        - random-gif
 *     responses:
 *        200:
 *          description: Succès de la requête
 */
router.get('/', async (req, res) => {
    const word = await axios.get('https://random-word-api.herokuapp.com/word?number=1');
    const gif = await getGif(word.data[0]);
    res.status(200).send({ 'word': word.data[0], 'gif': gif });
});

/**
 * @swagger
 *  /random-gif/{word}:
 *  get:
 *     description: Récupère un GIF associé à un mot
 *     tags:
 *        - random-gif
 *     responses:
 *        200:
 *          description: Succès de la requête
 *     parameters:
 *        - word:
 *          name: word
 *          description: Mot à rechercher
 *          in: path
 *          required: true
 *          schema:
 *            type: string
 */
router.get('/:word', async (req, res) => {
    const word = req.params.word;
    const gif = await getGif(word);
    res.status(200).send({ 'word': word, 'gif': gif });
});

/**
 * @swagger
 *  /random-gif/{word}/{locale}/{number-of-gifs-to-randomize}:
 *  get:
 *     description: Récupère un GIF associé à un mot
 *     tags:
 *        - random-gif
 *     responses:
 *        200:
 *          description: Succès de la requête
 *     parameters:
 *        - word:
 *          name: word
 *          description: Mot à rechercher
 *          in: path
 *          required: true
 *          schema:
 *            type: string
 *        - locale:
 *          name: locale
 *          description: Locale (ex => FR, US, etc.) de la recherche du GIF
 *          in: path
 *          required: true
 *          schema:
 *            type: string
 *        - numberOfResults:
 *          name: numberOfResults
 *          description: Nombre de résultats à randomizer
 *          in: path
 *          required: true
 *          schema:
 *            type: integer
 */
router.get('/:word/:locale/:numberOfResults', async (req, res) => {
    const word = req.params.word;
    const locale = req.params.locale;
    const numberOfResults = req.params.numberOfResults;
    const gif = await getGif(word, locale, numberOfResults);
    res.status(200).send({ 'word': word, 'gif': gif });
});

module.exports = router;