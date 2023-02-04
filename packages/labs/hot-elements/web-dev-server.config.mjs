import {esbuildPlugin} from '@web/dev-server-esbuild';
import {hmrPlugin} from '@web/dev-server-hmr';
import {getRequestFilePath} from '@web/dev-server-core';
import * as path from 'path';

export default {
  plugins: [
    {
      serverStart({config, fileWatcher}) {
        this.config = config;
        console.log(path.resolve('./src/test/demo.ts'));
        setInterval(() => {
          fileWatcher.emit('change', path.resolve('./src/test/demo.ts'));
        }, 1000);
      },
      count: 0,
      transform(context) {
        const path = getRequestFilePath(context.url, this.config.rootDir);
        if (!path.endsWith('demo.ts')) {
          return;
        }
        console.log('boop!');
        // return `document.body.textContent = 'Hello World ${++this.count}'`;
      },
    },
    esbuildPlugin({ts: true}),
    hmrPlugin(),
  ],
  nodeResolve: {
    exportConditions: ['development'],
  },
};
