import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import randomGif from './routes/randomGif.js';
import { openApiSpec } from './openapi.js';

export const app = new Hono();

app.use('*', cors({ origin: '*' }));

app.route('/random-gif', randomGif);

app.get('/openapi.json', (c) => c.json(openApiSpec));
app.get('/swagger-random-gif', swaggerUI({ url: '/openapi.json' }));

app.use('/*', serveStatic({ root: './static' }));
