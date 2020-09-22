import {playwrightLauncher} from '@web/test-runner-playwright';
import {fromRollup} from '@web/dev-server-rollup';
import alias from '@rollup/plugin-alias';

const plugins = [];
if (process.env.TEST_PROD_BUILD) {
  // Our test files use relative imports for the locally built lit-html modules.
  // By default that means the ones in the development/ directory. Our
  // production build has the same layout, just one directory up. Assume that
  // "lit-html.js" and "directives/" module specifiers must refer to these
  // modules, and re-write them to reach up a directory.
  console.log('Using production build');
  plugins.push(
    fromRollup(alias)({
      entries: [
        {find: /(.*)\/(lit-html.js)$/, replacement: '$1/../$2'},
        {find: /(.*)\/(directives\/.*)/, replacement: '$1/../$2'},
      ],
    })
  );
}

export default {
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
  middleware: [
    (ctx, next) => {
      ctx.response.append(
          'Content-Security-Policy', `require-trusted-types-for 'script';`)
      return next();
    }
  ]
};
