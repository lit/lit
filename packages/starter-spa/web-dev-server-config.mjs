import {hmrPlugin, presets} from '@open-wc/dev-server-hmr';
import {esbuildPlugin} from '@web/dev-server-esbuild';

export default {
  plugins:[
        esbuildPlugin({ts: true, target: 'es2020', tsconfig: 'tsconfig.json'}),
        {
          /**
           *
           * @param {{url: string, response: Response}} context
           */
          transform: async ({url, response}) => {
            if (url.startsWith('/src/_router.ts')) {
              let body = response.body;
              body +=
                '\nexport const __invalidate = () => {import.meta.hot.invalidate();};';
              response.body = body;
              return response;
            } else if (
              url.startsWith('/src/views/') ||
              url.startsWith('/src/layouts/') ||
              url.startsWith('/src/_routes.ts') ||
              url.startsWith('/src/view-shared.styles.ts')
            ) {
              let body = response.body;
              body += `
              import.meta.hot.acceptDeps(['/src/_router.ts'], deps => {
                deps[0].__invalidate();
              });
              `;
              response.body = body;
              return response;
            }
          },
        },
        hmrPlugin({
          include: ['src/**/*'],
          presets: [presets.lit],
          patches: [
            '\nexport const __invalidate = () => {import.meta.hot.invalidate();};',
          ],
        }),
      ],
  watch: false,
  appIndex: 'index-dev.html',
  nodeResolve: true,
};
