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
    // Convert the path to base64 to prevent any special characters
    // from being falsely interpreted as code.
    const base64url = btoa(url);
    const code = `
      import {readFile} from 'node:fs/promises';
      import {CSSStyleSheet} from '@lit-labs/ssr-dom-shim';
      const url = new URL(atob('${base64url}'));
      const css = await readFile(url, 'utf-8');
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
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
