/* eslint-disable import/no-extraneous-dependencies */
import {build} from 'esbuild';
import {minifyHTMLLiteralsPlugin} from 'esbuild-plugin-minify-html-literals';
import {readFile, writeFile} from 'fs/promises';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';
import {minify} from 'html-minifier';

await build({
  bundle: true,
  entryPoints: ['src/hydrate-support.ts', 'src/_router.ts'],
  outdir: 'build',
  minify: true,
  format: 'esm',
  treeShaking: true,
  splitting: true,
  incremental: true,
  plugins: [minifyHTMLLiteralsPlugin()],
  write: true,
});

const __dirname = dirname(fileURLToPath(import.meta.url));

const fileToString = async (relativePath) => {
  return (await readFile(resolve(__dirname, relativePath), 'utf8')).toString();
};
const indexContents = await fileToString('./index.html');
const indexStyles = await fileToString('./assets/root-styles.css');
const inlinedStyles = indexContents.replace(
  /<link rel="stylesheet".+>/,
  indexStyles
);
await writeFile(
  resolve(__dirname, './index-prod.html'),
  minify(inlinedStyles, {
    minifyCSS: true,
    minifyJS: true,
    collapseWhitespace: true,
    removeTagWhitespace: true,
  })
);

process.exit(0);
