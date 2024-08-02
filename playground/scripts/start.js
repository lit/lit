import {spawn} from 'child_process';
import {join} from 'path';
import {normalizePath} from './util.js';

const usage = `Usage:

npm run start -- path

- <path> must be a path to a directory beneath <lit-monorepo>/playground/p
  - You may use the 'p/' prefix, but it is not required
`;

async function start(path) {
  if (typeof path !== 'string') {
    return console.error(usage);
  }

  path = normalizePath(path);

  const viteBin = join(process.cwd(), 'node_modules', '.bin', 'vite');
  const viteConfig = join(process.cwd(), 'vite.config.js');

  process.chdir(path);

  const devServer = await spawn('node', [viteBin, '--config', viteConfig]);

  devServer.stdout.on('data', (data) => console.log(data.toString()));
  devServer.stderr.on('data', (data) => console.error(data.toString()));
  devServer.on('close', (code) => console.log('>>> close', code));
}

console.log(process.argv[2]);

await start(process.argv[2]);
