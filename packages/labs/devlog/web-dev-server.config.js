import {esbuildPlugin} from '@web/dev-server-esbuild';
import {hmrPlugin} from '@web/dev-server-hmr';
import {fileURLToPath} from 'node:url';

// A config to give us fast HMR.
export default {
  plugins: [
    esbuildPlugin({
      ts: true,
      tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
    }),
    hmrPlugin(),
    {
      name: 'request-own-process',
      transform(context) {
        return {
          ...context,
          headers: {
            ...context.headers,
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
          },
        };
      },
    },
  ],
  nodeResolve: {
    exportConditions: ['development'],
  },
  watch: true,
  open: true,
  appIndex: 'demo/index.html',
};
