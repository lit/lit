/* eslint-disable import/no-extraneous-dependencies */
import fastifyStatic from '@fastify/static';
import fastify from 'fastify';
import path from 'path';
import {fileURLToPath} from 'url';
import {render} from './ssr.js';
import {Readable} from 'stream';

const app = fastify({logger: true});
const __dirname = path.dirname(fileURLToPath(import.meta.url));

await app.register(import('@fastify/compress'), {global: true});

app.register((instance, _opts, next) => {
  instance.register(fastifyStatic, {
    root: path.resolve(__dirname, '../build'),
    prefix: '/build',
  });
  next();
});

app.register((instance, _opts, next) => {
  instance.register(fastifyStatic, {
    root: path.resolve(__dirname, '../assets'),
    prefix: '/assets',
  });
  next();
});

app.get('/favicon.ico', async (request, reply) => {
  return reply.callNotFound();
});

app.get('/*', async (request, reply) => {
  const indexGenerator = await render(request.url);
  const stream = Readable.from(indexGenerator);
  return reply.type('text/html').send(stream);
});

// Run the server!
const start = async () => {
  try {
    await app.listen({port: 3000});
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
