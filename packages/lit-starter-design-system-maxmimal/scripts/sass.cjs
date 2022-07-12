const {compile} = require('sass');
const {writeFile} = require('fs/promises');
const glob = require('fast-glob');

(async () => {
  const entries = await glob('src/components/**/*.styles.scss');

  const sassStringToTs = (sassString) => {
    return `import {css} from 'lit';export const styles = css\`${sassString}\`;`;
  };

  const promises = [];

  for (const entry of entries) {
    console.log(`[sass.cjs] compiling: ${entry}`);
    const result = compile(entry);
    const output = entry.replace(/\.styles\.scss$/, '.styles.ts');
    console.log(`[sass.cjs] writing to: ${output}`);
    const writePromise = writeFile(output, sassStringToTs(result.css)).then(
      () => {
        console.log(`[sass.cjs] wrote: ${output}`);
      }
    );
    promises.push(writePromise);
  }

  await Promise.all(promises);
})();
