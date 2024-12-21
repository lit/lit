import {readFileSync} from 'node:fs';
import type {LoadHook, ResolveHook} from 'node:module';
import {fileURLToPath} from 'node:url';

/**
 * Checks for each import, whether the file exists and if not, tries
 * to find an associated TypeScript file.
 *
 * https://nodejs.org/api/module.html#resolvespecifier-context-nextresolve
 */
export const resolve: ResolveHook = (specifier, context, nextResolve) => {
  if (context.importAttributes.type === 'css') {
    return {
      format: 'module',
      shortCircuit: true,
      url: new URL(specifier, context.parentURL).toString(),
    };
  }
  return nextResolve(specifier, context);
};

/**
 * When an attempt is made to import a CSS file/module, the CSS content
 * is read and added to a CSSRule, which is provided in a CSSStyleSheet
 * instance.
 *
 * https://nodejs.org/api/module.html#loadurl-context-nextload
 */
export const load: LoadHook = (url, context, nextLoad) => {
  if (context.importAttributes.type === 'css') {
    const filePath = fileURLToPath(url);
    const css = readFileSync(filePath, 'utf8');
    const code = `
      import {CSSStyleSheet} from '@lit-labs/ssr-dom-shim';
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(\`${css.replaceAll('`', '\\`')}\`);
      export default sheet;
    `;
    return {format: 'module', shortCircuit: true, source: code};
  }
  return nextLoad(url, context);
};
