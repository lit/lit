import {defineConfig} from 'vite';
import {access} from 'fs/promises';
import {dirname, join} from 'path';

export default defineConfig(async () => {
  let allowedHosts = [];
  try {
    const config = await import('./allowed-hosts.js');
    allowedHosts = config.allowedHosts || [];
  } catch (e) {
    // Ignore error if file not found
  }

  return {
    esbuild: {
      target: 'es2021',
    },
    server: {
      ...(allowedHosts.length > 0 ? {allowedHosts} : {}),
    },
    plugins: [
      {
        name: 'test-plugin',
        resolveId: async (source, importer) => {
          if (importer.endsWith('.html') && source.endsWith('.js')) {
            let path = join(dirname(importer), source);
            try {
              await access(path);
              return path;
            } catch (e) {
              path = path.replace(/\.js$/, '.ts');
              try {
                await access(path);
                return path;
              } catch (e) {
                console.warn(
                  `Couldn't find imported module ${source} imported by ${importer}`
                );
              }
            }
          }
          return null;
        },
      },
    ],
  };
});
