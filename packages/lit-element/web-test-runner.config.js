import {playwrightLauncher} from '@web/test-runner-playwright';
import {fromRollup} from '@web/dev-server-rollup';
import resolveRemap from '../common/rollup-resolve-remap.js';
import configs from '../common/wtr-config.js';

const plugins = [];
if (process.env.TEST_PROD_BUILD) {
  console.log('Using production builds');
  plugins.push(fromRollup(resolveRemap)(configs.prodResolveRemapConfig));
} else {
  console.log('Using development builds');
  plugins.push(fromRollup(resolveRemap)(configs.devResolveRemapConfig));
}

export default {
  rootDir: '../../',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({product: 'chromium'}),
    playwrightLauncher({product: 'firefox'}),
    playwrightLauncher({product: 'webkit'}),
  ],
  testFramework: {
    config: {
      ui: 'tdd',
      timeout: '2000',
    },
  },
  plugins,
};
