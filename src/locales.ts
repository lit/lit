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

/**
 * This is not an exhaustive list, simply the list of locales we have
 * encountered so far. It is expected that this module should be updated as new
 * locales are added.
 */
const locales = ['en', 'es-419'] as const;

export type Locale = typeof locales[number];

/**
 * Return whether the given string is a known locale.
 */
export function isLocale(x: string): x is Locale {
  return locales.includes(x as Locale);
}

/**
 * Many applications need to present a locale switcher, and usually we want
 * each locale choice to be displayed in its native language. Since this is a
 * static list across applications, it doesn't need translation per application
 * and can just be hard-coded here.
 */
const localeDisplayNames: {[P in Locale]: string} = {
  en: 'English',
  'es-419': 'Español',
};

/**
 * Generate a TypeScript object that maps from locale ID to a localized display
 * name for that locale.
 */
export const localeDisplayNameObject = (locales: Locale[]): string => {
  const entries = locales.map((locale) => {
    const displayName = localeDisplayNames[locale];
    if (displayName === undefined) {
      throw new Error(
        `No native language name for locale ${locale}, please add it to locale-display-names.ts`
      );
    }
    return `['${locale}']: '${displayName}',`;
  });
  return `{ ${entries.join('\n')} } as const`;
};
