// Do not modify this file by hand!
// Re-generate this file by running lit-localize

/* eslint-disable @typescript-eslint/no-explicit-any */

import {TemplateResult} from 'lit-html';
import {messages as esMessages} from './es.js';
import {messages as es_419Messages} from './es-419.js';
import {messages as zh_CNMessages} from './zh_CN.js';

export const supportedLocales = ['en', 'es', 'es-419', 'zh_CN'] as const;

export type SupportedLocale = typeof supportedLocales[number];

export const isSupportedLocale = (x: string): x is SupportedLocale => {
  return supportedLocales.includes(x as SupportedLocale);
};

export const defaultLocale = 'en';

function getLocaleFromUrl() {
  const match = window.location.href.match(
    // eslint-disable-next-line no-useless-escape
    /^https?:\/\/[^\/]+\/(es-419|zh_CN|en|es)(?:$|[\/?#])/
  );
  if (match && isSupportedLocale(match[1])) {
    return match[1];
  }
  return defaultLocale;
}

const locale = getLocaleFromUrl();

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
  source: string | TemplateResult | (() => string | TemplateResult),
  ...params: unknown[]
): string | TemplateResult {
  let resolved;
  switch (locale) {
    case defaultLocale:
      resolved = source;
      break;

    case 'es':
      resolved = esMessages[name];
      break;
    case 'es-419':
      resolved = es_419Messages[name];
      break;
    case 'zh_CN':
      resolved = zh_CNMessages[name];
      break;
    default:
      console.warn(`${locale} is not a supported locale`);
  }
  if (!resolved) {
    console.warn(`Could not find ${locale} string for ${name}`);
    resolved = source;
  }
  return typeof resolved === 'function'
    ? (resolved as any)(...params)
    : resolved;
}

type MessageName = 'hello';
