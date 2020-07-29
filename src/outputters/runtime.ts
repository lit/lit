/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {Message, ProgramMessage, Placeholder} from '../messages';
import {applyPatches, Patches} from '../patches';
import {Locale} from '../locales';
import {Config} from '../config';
import {KnownError} from '../error';
import * as fs from 'fs';
import * as pathLib from 'path';

/**
 * Configuration specific to the `runtime` output mode.
 */
export interface RuntimeOutputConfig {
  mode: 'runtime';

  /**
   * Output directory for generated TypeScript modules. After running
   * lit-localize, this directory will contain:
   *
   * 1. localization.ts -- A TypeScript module that exports the `msg` function,
   *    along with other utilities.
   *
   * 2. <locale>.ts -- For each `targetLocale`, a TypeScript module that exports
   *    the translations in that locale keyed by message ID. These modules are
   *    used automatically by localization.ts and should not typically be
   *    imported directly by user code.
   */
  outputDir: string;

  /**
   * The initial locale, if no other explicit locale selection has been made.
   * Defaults to the value of `sourceLocale`.
   *
   * @TJS-type string
   */
  defaultLocale?: Locale;

  /**
   * If true, export a `setLocale(locale: Locale)` function in the generated
   * `<outputDir>/localization.ts` module. Defaults to false.
   *
   * Note that calling this function will set the locale for subsequent calls to
   * `msg`, but will not automatically re-render existing templates.
   */
  exportSetLocaleFunction?: boolean;

  /**
   * Automatically set the locale based on the URL at application startup.
   */
  setLocaleFromUrl?: {
    /**
     * Set locale based on matching a regular expression against the URL.
     *
     * The regexp will be matched against `window.location.href`, and the first
     * capturing group will be used as the locale. If no match is found, or if
     * the capturing group does not contain a valid locale code, then
     * `defaultLocale` is used.
     *
     * Optionally use the special string `:LOCALE:` to substitute a capturing
     * group into the regexp that will only match the currently configured
     * locale codes (`sourceLocale` and `targetLocales`). For example, if
     * sourceLocale=en and targetLocales=es,zh_CN, then the regexp
     * "^https?://:LOCALE:\\." becomes "^https?://(en|es|zh_CN)\\.".
     *
     * Tips: Remember to double-escape literal backslashes (once for JSON, once
     * for the regexp), and note that you can use `(?:foo)` to create a
     * non-capturing group.
     *
     * It is an error to set both `regexp` and `param`.
     *
     * Examples:
     *
     * 1. "^https?://[^/]+/:LOCALE:(?:$|[/?#])"
     *
     *     Set locale from the first path component.
     *
     *     E.g. https://www.example.com/es/foo
     *                                  ^^
     *
     * 2. "^https?://:LOCALE:\\."
     *
     *     Set locale from the first subdomain.
     *
     *     E.g. https://es.example.com/foo
     *                  ^^
     */
    regexp?: string;

    /**
     * Set locale based on the value of a URL query parameter.
     *
     * Finds the first matching query parameter from `window.location.search`.
     * If no such URL query parameter is set, or if it is not a valid locale
     * code, then `defaultLocale` is used.
     *
     * It is an error to set both `regexp` and `param`.
     *
     * Examples:
     *
     * 1. "lang"
     *
     *     https://example.com?foo&lang=es&bar
     *                                  ^^
     */
    param?: string;
  };
}

/**
 * Write output for the `runtime` output mode.
 */
export function runtimeOutput(
  messages: ProgramMessage[],
  translationMap: Map<Locale, Message[]>,
  config: Config,
  runtimeConfig: RuntimeOutputConfig
) {
  // Write our "localization.ts" TypeScript module. This is the file that
  // implements the "msg" function for our TypeScript program.
  const ts = generateMsgModule(messages, config, runtimeConfig);
  const tsFilename = pathLib.join(
    config.resolve(runtimeConfig.outputDir),
    'localization.ts'
  );
  try {
    fs.writeFileSync(tsFilename, ts);
  } catch (e) {
    throw new KnownError(
      `Error writing TypeScript file: ${tsFilename}\n` +
        `Does the parent directory exist, ` +
        `and do you have write permission?\n` +
        e.message
    );
  }
  // For each translated locale, generate a "<locale>.ts" TypeScript module that
  // contains the mapping from message ID to each translated version. The
  // "localization.ts" file we generated earlier knows how to import and switch
  // between these maps.
  for (const locale of config.targetLocales) {
    const translations = translationMap.get(locale) || [];
    const ts = generateLocaleModule(
      locale,
      translations,
      messages,
      config.patches || {}
    );
    fs.writeFileSync(
      pathLib.join(config.resolve(runtimeConfig.outputDir), `${locale}.ts`),
      ts
    );
  }
}

/**
 * Generate a TypeScript module which exports:
 *
 * (1) function msg: Takes a message name and a default language string/lit-html template,
 * and return a template for that message in the currently active locale.
 *
 * (2) function getLocale: Returns the active locale, as determined by the
 * ?locale URL parameter.
 *
 * (3) Misc other useful objects such as the list of supported locales.
 *
 * TypeScript will enforce that only messages that have been extracted by this
 * generator can be referenced in `msg` calls, and only our supported locales
 * can be switched to by `setLocale`.
 */
function generateMsgModule(
  msgs: Message[],
  config: Config,
  runtime: RuntimeOutputConfig
): string {
  msgs = copyMessagesSortedByName(msgs);
  const locales = [config.sourceLocale, ...config.targetLocales];
  const localesArray = locales
    .sort()
    .map((locale) => `'${locale}'`)
    .join(', ');
  const messageNamesUnion = msgs.map((msg) => `'${msg.name}'`).join('|');
  const localeImports = locales
    .slice(1)
    .map(
      (locale) =>
        `import {messages as ${locale.replace(
          '-',
          '_'
        )}Messages} from './${locale}.js';`
    )
    .join('\n');
  return `
    // Do not modify this file by hand!
    // Re-generate this file by running lit-localize

    /* eslint-disable @typescript-eslint/no-explicit-any */

    import {TemplateResult} from 'lit-html';
    ${localeImports}

    export const supportedLocales = [${localesArray}] as const;

    export type SupportedLocale = typeof supportedLocales[number];

    export const isSupportedLocale = (x: string): x is SupportedLocale => {
      return supportedLocales.includes(x as SupportedLocale);
    };

    export const defaultLocale = '${config.sourceLocale}';

    ${genLocaleInitialization(config, runtime)}

    export function msg(name: MessageName, str: string): string;

    export function msg(name: MessageName, tmpl: TemplateResult): TemplateResult;

    export function msg<F extends (...args: any) => string>(
      name: MessageName,
      fn: F,
      ...params: Parameters<F>
    ): string;

    export function msg<F extends (...args: any) => TemplateResult>(
      name: MessageName,
      fn: F,
      ...params: Parameters<F>
    ): TemplateResult;

    export function msg(
      name: MessageName,
      source: string|TemplateResult|(() => string|TemplateResult),
      ...params: unknown[]): string|TemplateResult {
      let resolved;
      switch (locale) {
        case defaultLocale:
          resolved = source;
          break;
        ${config.targetLocales
          .map(
            (locale) => `
        case '${locale}':
          resolved = ${locale.replace('-', '_')}Messages[name];
          break;`
          )
          .join('')}
        default:
          console.warn(\`\${locale} is not a supported locale\`);
      }
      if (!resolved) {
        console.warn(\`Could not find \${locale} string for \${name}\`);
        resolved = source;
      }
      return typeof resolved === 'function'
        ? (resolved as any)(...params)
        : resolved;
    }

    type MessageName = ${messageNamesUnion};
  `;
}

/**
 * Generate the setLocale and getLocaleFromUrl functions.
 */
function genLocaleInitialization(
  config: Config,
  runtime: RuntimeOutputConfig
): string {
  const ts = [];
  let isConst = true;
  let isSetFromUrl = false;

  if (runtime.exportSetLocaleFunction) {
    isConst = false;
    ts.push(`
      export function setLocale(newLocale: SupportedLocale) {
        if (isSupportedLocale(newLocale)) {
          locale = newLocale;
        }
      }
    `);
  }

  if (runtime.setLocaleFromUrl) {
    const {regexp, param} = runtime.setLocaleFromUrl;
    isSetFromUrl = true;

    if (regexp) {
      const allLocales = [config.sourceLocale, ...config.targetLocales];
      allLocales.sort((a, b) => {
        // The regexp group must match longer locale codes first, because
        // otherwise e.g. "es" would match before "es-419" does.
        if (a.length !== b.length) {
          return b.length - a.length;
        }
        // Fall back to lexicographic for stability of generated code.
        return a.localeCompare(b);
      });
      const finalRegexp = regexp
        .replace(':LOCALE:', `(${allLocales.join('|')})`)
        // Note eslint errors about useless escapes on a regexp like `/[\/]/`
        // because the JS regexp parser is smart enough to know that the `/`
        // inside the `[]` is unambiguous. That's too clever for us, though.
        .replace(/\//g, '\\/');
      ts.push(`
        function getLocaleFromUrl() {
          const match = window.location.href.match(
              // eslint-disable-next-line no-useless-escape
              /${finalRegexp}/);
          if (match && isSupportedLocale(match[1])) {
            return match[1];
          }
          return defaultLocale;
        }
      `);
    } else if (param) {
      ts.push(`
        function getLocaleFromUrl() {
          for (const param of window.location.search.substring(1).split('&')) {
            if (param.startsWith('${param}=')) {
              const value = decodeURIComponent(
                param.substring(${param.length + 1}));
              if (isSupportedLocale(value)) {
                return value;
              }
              break;
            }
          }
          return defaultLocale;
        }
      `);
    } else {
      throw new KnownError(
        'Internal error: setLocaleFromUrl config had neither regex nor param.'
      );
    }
  }

  const varType = isConst ? 'const' : 'let';
  if (isSetFromUrl) {
    ts.push(`${varType} locale = getLocaleFromUrl();`);
  } else {
    // We need the cast so that locale doesn't get overly-narrowed to the
    // default const value, and then disallow comparisons against other values.
    ts.push(`${varType} locale = defaultLocale as SupportedLocale;`);
  }

  return ts.join('\n');
}

/**
 * Generate a "<locale>.ts" TypeScript module from the given bundle of
 * translated messages.
 */
function generateLocaleModule(
  locale: Locale,
  translations: Message[],
  canonMsgs: ProgramMessage[],
  patches: Patches
): string {
  translations = copyMessagesSortedByName(translations);
  // The unique set of message names in the canonical messages we extracted from
  // the TypeScript program.
  const canonMsgsByName = new Map<string, ProgramMessage>();
  for (const canon of canonMsgs) {
    canonMsgsByName.set(canon.name, canon);
  }

  // The unique set of message names we found in this XLB translations file.
  const translatedMsgNames = new Set<string>();

  // Whether we'll need to import the lit-html "html" function.
  let importLit = false;

  const entries = [];
  for (const msg of translations) {
    const canon = canonMsgsByName.get(msg.name);
    if (canon === undefined) {
      console.warn(
        `${locale} message ${msg.name} does not exist in canonical messages, skipping`
      );
      continue;
    }
    translatedMsgNames.add(msg.name);
    const msgStr = makeMessageString(msg.contents, canon);
    const patchedMsgStr = applyPatches(patches, locale, msg.name, msgStr);
    entries.push(`${msg.name}: ${patchedMsgStr},`);
  }
  for (const msg of canonMsgs) {
    if (msg.isLitTemplate) {
      importLit = true;
    }
    if (translatedMsgNames.has(msg.name)) {
      continue;
    }
    console.warn(
      `${locale} message ${msg.name} is missing, using canonical text as fallback`
    );
    const msgStr = makeMessageString(msg.contents, msg);
    entries.push(`${msg.name}: ${msgStr},`);
  }
  return `
    // Do not modify this file by hand!
    // Re-generate this file by running lit-localize

    ${importLit ? "import {html} from 'lit-html';" : ''}

    /* eslint-disable no-irregular-whitespace */
    /* eslint-disable @typescript-eslint/no-explicit-any */

    export const messages = {
      ${entries.join('\n')}
    };
  `;
}

/**
 * Sort by message name for easier diffing. Note that unlike XLB files, where
 * order corresponds to how translators will see our strings, order is not
 * semantically meaningful in the generated TypeScript files.
 */
function copyMessagesSortedByName(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Convert the contents of a parsed XLB message to a TypeScript string,
 * possibly using lit-html if there is embedded HTML.
 */
function makeMessageString(
  contents: Array<string | Placeholder>,
  canon: ProgramMessage
): string {
  const fragments = [];
  for (const content of contents) {
    if (typeof content === 'string') {
      fragments.push(escapeStringLiteral(content));
    } else {
      fragments.push(content.untranslatable);
    }
  }
  // We use <ph> placeholders to safely pass embedded HTML markup and
  // template expressions through translation.
  const tag = canon.isLitTemplate ? 'html' : '';
  const msgStr = `${tag}\`${fragments.join('')}\``;
  if (canon.params !== undefined && canon.params.length > 0) {
    return `(${canon.params
      .map((param) => `${param}: any`)
      .join(', ')}) => ${msgStr}`;
  } else {
    return msgStr;
  }
}

/**
 * Escape a string such that it can be safely embedded in a JavaScript template
 * literal (backtick string).
 */
function escapeStringLiteral(unescaped: string): string {
  return unescaped
    .replace(`\\`, `\\\\`)
    .replace('`', '\\`')
    .replace('$', '\\$');
}
