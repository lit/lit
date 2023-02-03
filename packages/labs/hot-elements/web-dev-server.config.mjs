import {esbuildPlugin} from '@web/dev-server-esbuild';
import {hmrPlugin} from '@web/dev-server-hmr';

export default {
  plugins: [esbuildPlugin({ts: true}), hmrPlugin()],
  nodeResolve: {
    exportConditions: ['development'],
  },
};
