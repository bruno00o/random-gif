const express = require('express');
const router = express.Router();
const env = require('dotenv').config();

const tenorUrl = "https://tenor.googleapis.com/v2/search?"
const tenorKey = process.env.TENOR_KEY;

const getGif = async (word, locale = 'US', numberOfResults = 10) => {
    const url = `${tenorUrl}key=${tenorKey}&q=${word}&limit=${numberOfResults}&media_filter=gif&locale=${locale}`;

    const response = await fetch(url);
    const data = await response.json();
    const gif = data.results[Math.floor(Math.random() * numberOfResults)].media_formats.gif.url;

    return gif;
};

/**
 * @swagger
 *  /random-gif/:
 *  get:
 *     description: Get a random GIF from Tenor API
 *     tags:
 *        - random-gif
 *     responses:
 *        200:
 *          description: Returns a random GIF from Tenor API
 *     parameters:
 *       - in: query
 *         name: request
 *         schema:
 *           type: string
 *           description: Request to search on Tenor
 *           example: "random"
 *       - in: query
 *         name: locale
 *         schema:
 *           type: string
 *           description: Language of the request to search on Tenor
 *           example: "US"
 *       - in: query
 *         name: numberOfResults
 *         schema:
 *           type: string
 *           description: Number of results to search on Tenor (for randomization)
 *           example: "10"
 */
router.get('/', async (req, res) => {
    const query = req.query;
    let word;
    if (query.request && query.request != "") {
        word = decodeURIComponent(query.request);
    } else {
        const response = await fetch('http://tudo7370.odns.fr/v1/word');
        // const response = await fetch('https://random-word.ryanrk.com/api/en/word/random');
        const data = await response.json();
        word = data[0];
    }
    const locale = query.locale && query.locale != "" && query.locale.match(/^[a-zA-Z]+$/) ? query.locale : 'US';
    const numberOfResults = query.numberOfResults && query.numberOfResults != "" && query.numberOfResults.toString().match(/^[0-9]+$/) ? query.numberOfResults : 10;

    const gif = await getGif(word, locale, numberOfResults);

    res.status(200).send({ 'word': word, 'gif': gif, 'locale': locale, 'numberOfResults': numberOfResults });
});

module.exports = router;