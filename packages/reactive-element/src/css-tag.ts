/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const NODE_MODE = false;

// Allows minifiers to rename references to globalThis
const global = globalThis;

/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
export const supportsAdoptingStyleSheets: boolean =
  global.ShadowRoot &&
  (global.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) &&
  'adoptedStyleSheets' in Document.prototype &&
  'replace' in CSSStyleSheet.prototype;

/**
 * A CSSResult or native CSSStyleSheet.
 *
 * In browsers that support constructible CSS style sheets, CSSStyleSheet
 * object can be used for styling along side CSSResult from the `css`
 * template tag.
 */
export type CSSResultOrNative = CSSResult | CSSStyleSheet;

export type CSSResultArray = Array<CSSResultOrNative | CSSResultArray>;

/**
 * A single CSSResult, CSSStyleSheet, or an array or nested arrays of those.
 */
export type CSSResultGroup = CSSResultOrNative | CSSResultArray;

const constructionToken = Symbol();

const cssTagCache = new WeakMap<TemplateStringsArray, CSSStyleSheet>();

/**
 * A container for a string of CSS text, that may be used to create a CSSStyleSheet.
 *
 * CSSResult is the return value of `css`-tagged template literals and
 * `unsafeCSS()`. In order to ensure that CSSResults are only created via the
 * `css` tag and `unsafeCSS()`, CSSResult cannot be constructed directly.
 */
export class CSSResult {
  // This property needs to remain unminified.
  ['_$cssResult$'] = true;
  readonly cssText: string;
  private _styleSheet?: CSSStyleSheet;
  private _strings: TemplateStringsArray | undefined;

  private constructor(
    cssText: string,
    strings: TemplateStringsArray | undefined,
    safeToken: symbol
  ) {
    if (safeToken !== constructionToken) {
      throw new Error(
        'CSSResult is not constructable. Use `unsafeCSS` or `css` instead.'
      );
    }
    this.cssText = cssText;
    this._strings = strings;
  }

  // This is a getter so that it's lazy. In practice, this means stylesheets
  // are not created until the first element instance is made.
  get styleSheet(): CSSStyleSheet | undefined {
    // If `supportsAdoptingStyleSheets` is true then we assume CSSStyleSheet is
    // constructable.
    let styleSheet = this._styleSheet;
    const strings = this._strings;
    if (supportsAdoptingStyleSheets && styleSheet === undefined) {
      const cacheable = strings !== undefined && strings.length === 1;
      if (cacheable) {
        styleSheet = cssTagCache.get(strings);
      }
      if (styleSheet === undefined) {
        (this._styleSheet = styleSheet = new CSSStyleSheet()).replaceSync(
          this.cssText
        );
        if (cacheable) {
          cssTagCache.set(strings, styleSheet);
        }
      }
    }
    return styleSheet;
  }

  toString(): string {
    return this.cssText;
  }
}

type ConstructableCSSResult = CSSResult & {
  new (
    cssText: string,
    strings: TemplateStringsArray | undefined,
    safeToken: symbol
  ): CSSResult;
};

const textFromCSSResult = (value: CSSResultGroup | number) => {
  // This property needs to remain unminified.
  if ((value as CSSResult)['_$cssResult$'] === true) {
    return (value as CSSResult).cssText;
  } else if (typeof value === 'number') {
    return value;
  } else {
    throw new Error(
      `Value passed to 'css' function must be a 'css' function result: ` +
        `${value}. Use 'unsafeCSS' to pass non-literal values, but take care ` +
        `to ensure page security.`
    );
  }
};

/**
 * Wrap a value for interpolation in a {@linkcode css} tagged template literal.
 *
 * This is unsafe because untrusted CSS text can be used to phone home
 * or exfiltrate data to an attacker controlled site. Take care to only use
 * this with trusted input.
 */
export const unsafeCSS = (value: unknown) =>
  new (CSSResult as ConstructableCSSResult)(
    typeof value === 'string' ? value : String(value),
    undefined,
    constructionToken
  );

/**
 * A template literal tag which can be used with LitElement's
 * {@linkcode LitElement.styles} property to set element styles.
 *
 * For security reasons, only literal string values and number may be used in
 * embedded expressions. To incorporate non-literal values {@linkcode unsafeCSS}
 * may be used inside an expression.
 */
export const css = (
  strings: TemplateStringsArray,
  ...values: (CSSResultGroup | number)[]
): CSSResult => {
  const cssText =
    strings.length === 1
      ? strings[0]
      : values.reduce(
          (acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1],
          strings[0]
        );
  return new (CSSResult as ConstructableCSSResult)(
    cssText,
    strings,
    constructionToken
  );
};

/**
 * Applies the given styles to a `shadowRoot`. When Shadow DOM is
 * available but `adoptedStyleSheets` is not, styles are appended to the
 * `shadowRoot` to [mimic spec behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
 * Note, when shimming is used, any styles that are subsequently placed into
 * the shadowRoot should be placed *before* any shimmed adopted styles. This
 * will match spec behavior that gives adopted sheets precedence over styles in
 * shadowRoot.
 */
export const adoptStyles = (
  renderRoot: ShadowRoot,
  styles: Array<CSSResultOrNative>
) => {
  if (supportsAdoptingStyleSheets) {
    (renderRoot as ShadowRoot).adoptedStyleSheets = styles.map((s) =>
      s instanceof CSSStyleSheet ? s : s.styleSheet!
    );
  } else {
    for (const s of styles) {
      const style = document.createElement('style');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nonce = (global as any)['litNonce'];
      if (nonce !== undefined) {
        style.setAttribute('nonce', nonce);
      }
      style.textContent = (s as CSSResult).cssText;
      renderRoot.appendChild(style);
    }
  }
};

const cssResultFromStyleSheet = (sheet: CSSStyleSheet) => {
  let cssText = '';
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};

export const getCompatibleStyle =
  supportsAdoptingStyleSheets ||
  (NODE_MODE && global.CSSStyleSheet === undefined)
    ? (s: CSSResultOrNative) => s
    : (s: CSSResultOrNative) =>
        s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;
