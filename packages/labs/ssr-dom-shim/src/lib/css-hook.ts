import {readFile} from 'node:fs/promises';
import type {LoadHook} from 'node:module';

/**
 * When an attempt is made to import a CSS file/module, code is
 * generated to read the corresponding file, add it to a CSSStyleSheet
 * instance and return that instance as the default export.
 *
 * https://nodejs.org/api/module.html#loadurl-context-nextload
 */
export const load: LoadHook = async (url, context, nextLoad) => {
  if (context.importAttributes.type === 'css') {
    const content = await readFile(new URL(url), 'utf-8');
    const code = `
      import {CSSStyleSheet} from '@lit-labs/ssr-dom-shim';
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(${JSON.stringify(content)});
      export default sheet;
    `;
    return {format: 'module', shortCircuit: true, source: code};
  } else if (new URL(url).pathname.endsWith('.css')) {
    try {
      return await nextLoad(url, context);
    } catch (e) {
      console.warn(
        `Tried to import ${url} without import attributes!\n` +
          `(e.g. use "import s from './a.css' with {type: 'css'}" instead of "import s from './a.css'")`
      );
      throw e;
    }
  }
  return await nextLoad(url, context);
};
