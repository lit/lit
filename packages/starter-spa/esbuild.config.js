import {build} from 'esbuild';
import {minifyHTMLLiteralsPlugin} from 'esbuild-plugin-minify-html-literals';

await build({
  bundle: true,
  entryPoints: ['src/_router.ts'],
  outdir: 'build',
  minify: true,
  format: 'esm',
  treeShaking: true,
  splitting: true,
  incremental: true,
  plugins: [minifyHTMLLiteralsPlugin()],
  write: true,
});

process.exit(0);
