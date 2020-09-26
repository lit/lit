import {Consumer, Provider, createContext} from './context.js';
import {UpdatingHost} from '../updating-controller.js';
import {supportsAdoptingStyleSheets} from 'lit-element';

const themeMoniker = 'element-theme';
const allThemeMoniker = 'all';

const sheetFromStyle = (style: HTMLStyleElement) => {
  let sheet;
  if (supportsAdoptingStyleSheets) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(style.textContent!);
  } else {
    const type = style.type;
    style.type = '';
    sheet = style.sheet;
    style.type = type;
  }
  return sheet!;
};

export type ThemeMap = {[index: string]: Array<CSSStyleSheet>};

let documentThemes: ThemeMap;

const getDocumentThemes = () => {
  if (!documentThemes) {
    documentThemes = {};
    const styles = document.querySelectorAll(`style[type=${themeMoniker}`);
    for (const style of styles) {
      const name = style.getAttribute('for') || allThemeMoniker;
      documentThemes[name] = documentThemes[name] || [];
      documentThemes[name].push(sheetFromStyle(style as HTMLStyleElement));
    }
  }
  return documentThemes;
};

const getThemesForElement = (name: string, themes: ThemeMap) => [
  ...themes[allThemeMoniker],
  ...(themes[name] || []),
];

export const ThemeContext = createContext(
  null,
  'theme',

  class ThemeProvider extends Provider {
    constructor(host: UpdatingHost, value: ThemeMap) {
      super(host, {...getDocumentThemes(), ...value});
    }
  },

  class ThemeConsumer extends Consumer {
    constructor(host: UpdatingHost) {
      super(host);
      this.value = getDocumentThemes();
    }

    requestUpdate() {
      if (!this.value) {
        return;
      }
      const styles = [
        ...(this.element.constructor as any)._elementStyles,
        ...getThemesForElement(this.element.localName, this.value),
      ];
      // TODO(sorvell): when polyfill is in use, does not replace styles.
      // TODO(sorvell): Make this public?
      (this.element as any).adoptStyles(styles);
    }
  }
);
