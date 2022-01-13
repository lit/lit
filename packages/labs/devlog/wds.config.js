import {esbuildPlugin} from '@web/dev-server-esbuild';
import {hmrPlugin} from '@web/dev-server-hmr';

export default {
  plugins: [
    esbuildPlugin({ts: true}),
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
