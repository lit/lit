import { build } from 'esbuild';
import { minifyHTMLLiteralsPlugin } from 'esbuild-plugin-minify-html-literals';

await build({
  bundle: true,
  entryPoints: ['docs-src/src/index.ts'],
  outdir: 'docs/build',
  minify: true,
  format: 'esm',
  treeShaking: true,
  splitting: true,
  incremental: true,
  plugins: [minifyHTMLLiteralsPlugin()],
  write: true,
});

process.exit(0);
