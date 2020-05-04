
    // Do not modify this file by hand!
    // Re-generate this file by running lit-localize

    import {TemplateResult} from 'lit-html';
    import {messages as es419Messages} from './es-419.js';

    export const getLocale = () => {
      return locale;
    };

    export const supportedLocales = ['en', 'es-419'] as const;

    export type SupportedLocale = typeof supportedLocales[number];

    export const isSupportedLocale = (x: string): x is SupportedLocale => {
      return supportedLocales.includes(x as SupportedLocale);
    };

    export const defaultLocale = 'en';

    const getLocaleFromUrl = () => {
      const url = new URL(document.location.href);
      const locale = new URLSearchParams(url.search).get('locale');
      if (locale) {
        if (isSupportedLocale(locale)) {
          return locale;
        } else {
          console.warn(`${locale} is not a supported locale`);
        }
      }
      return defaultLocale;
    };

    const locale = getLocaleFromUrl();

    export const msg = (name: MessageName, defaultValue: string|TemplateResult): string|TemplateResult => {
      let value;
      switch (locale) {
        case defaultLocale:
          return defaultValue;
        case 'es-419':
                value = es419Messages[name];
                break;
        default:
          // TODO unreachable
          console.warn(`${locale} is not a supported locale`);
          return defaultValue;
      }
      if (value !== undefined) {
        return value;
      }
      console.warn(`Could not find ${locale} string for ${name}`);
      return defaultValue;
    };

    type MessageName = 'a'|'b';
  