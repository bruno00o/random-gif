export const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Random GIF API',
        version: '1.0.0',
    },
    paths: {
        '/random-gif/': {
            get: {
                tags: ['random-gif'],
                description: 'Get a random GIF from Tenor API',
                parameters: [
                    {
                        in: 'query',
                        name: 'request',
                        schema: { type: 'string', example: 'random' },
                        description: 'Request to search on Tenor',
                    },
                    {
                        in: 'query',
                        name: 'locale',
                        schema: { type: 'string', example: 'US' },
                        description: 'Language of the request to search on Tenor',
                    },
                    {
                        in: 'query',
                        name: 'numberOfResults',
                        schema: { type: 'string', example: '10' },
                        description: 'Number of results to search on Tenor (for randomization)',
                    },
                ],
                responses: {
                    '200': { description: 'Returns a random GIF from Tenor API' },
                },
            },
        },
    },
} as const;
