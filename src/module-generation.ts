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

import {Message, ProgramMessage, Placeholder} from './messages';
import {applyPatches, Patches} from './patches';
import {Locale} from './locales';

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
export function generateMsgModule(
  msgs: Message[],
  targetLocales: Locale[],
  sourceLocale: Locale
): string {
  msgs = copyMessagesSortedByName(msgs);
  const locales = [sourceLocale, ...targetLocales];
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
    /* eslint-disable @typescript-eslint/camelcase */

    import {TemplateResult} from 'lit-html';
    ${localeImports}

    export const supportedLocales = [${localesArray}] as const;

    export type SupportedLocale = typeof supportedLocales[number];

    export const isSupportedLocale = (x: string): x is SupportedLocale => {
      return supportedLocales.includes(x as SupportedLocale);
    };

    export const defaultLocale = '${sourceLocale}';

    const getLocaleFromUrl = () => {
      const url = new URL(document.location.href);
      const locale = new URLSearchParams(url.search).get('locale');
      if (locale) {
        if (isSupportedLocale(locale)) {
          return locale;
        } else {
          console.warn(\`\${locale} is not a supported locale\`);
        }
      }
      return defaultLocale;
    };

    const locale = getLocaleFromUrl();

    export const getLocale = () => {
      return locale;
    };

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
        ${targetLocales
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
 * Generate a "<locale>.ts" TypeScript module from the given bundle of
 * translated messages.
 */
export function generateLocaleModule(
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
    /* eslint-disable @typescript-eslint/camelcase */
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
