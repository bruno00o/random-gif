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
 *     parameters:
 *       - in: query
 *         name: request
 *         schema:
 *           type: string
 *           description: Recherche à effectuer sur Tenor
 *           example: "random"
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *           description: Langue de la recherche à effectuer sur Tenor
 *           example: "US"
 *       - in: query
 *         name: numberOfResults
 *         schema:
 *           type: string
 *           description: Nombre de résultats à effectuer sur Tenor (pour la randomisation)
 *           example: "10"
 */
router.get('/', async (req, res) => {
    const query = req.query;
    const word = query.request && query.request != "" ? decodeURIComponent(query.request) : (await axios.get('https://random-word-api.herokuapp.com/word?number=1')).data[0];
    const locale = query.locale && query.locale != "" && query.locale.match(/^[a-zA-Z]+$/) ? query.locale : 'US';
    const numberOfResults = query.numberOfResults && query.numberOfResults != "" && query.numberOfResults.toString().match(/^[0-9]+$/) ? query.numberOfResults : 10;

    const gif = await getGif(word, locale, numberOfResults);

    res.status(200).send({ 'word': word, 'gif': gif, 'locale': locale, 'numberOfResults': numberOfResults });
});

module.exports = router;