const express = require('express');
const cors = require('cors');
const env = require('dotenv').config();
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const randomGif = require('./routes/randomGif');

const app = express();

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.3',
        info: {
            title: 'Random GIF API',
            version: '1.0.0',
            servers: [process.env.URL_API]
        },
    },
    apis: [
        'index.js',
        './routes/*.js',
    ],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(cors({
    origin: '*',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use('/random-gif', randomGif);

/* redirects the default url to /docs */
app.get('/', (req, res) => {
    res.redirect('/swagger-random-gif');
});

app.use('/swagger-random-gif', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

module.exports = app;