/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
export const supportsAdoptingStyleSheets =
  window.ShadowRoot &&
  (window.ShadyCSS === undefined || window.ShadyCSS.nativeShadow) &&
  'adoptedStyleSheets' in Document.prototype &&
  'replace' in CSSStyleSheet.prototype;

export type CSSResultOrNative = CSSResult | CSSStyleSheet;

export type CSSResultFlatArray = CSSResultOrNative[];

export type CSSResultArray = Array<CSSResultOrNative | CSSResultArray>;

export type CSSResultGroup = CSSResultOrNative | CSSResultArray;

const constructionToken = Symbol();

export class CSSResult {
  readonly cssText: string;
  private _styleSheet?: CSSStyleSheet;

  constructor(cssText: string, safeToken: symbol) {
    if (safeToken !== constructionToken) {
      throw new Error(
        'CSSResult is not constructable. Use `unsafeCSS` or `css` instead.'
      );
    }
    this.cssText = cssText;
  }

  // Note, this is a getter so that it's lazy. In practice, this means
  // stylesheets are not created until the first element instance is made.
  get styleSheet(): CSSStyleSheet | undefined {
    // Note, if `supportsAdoptingStyleSheets` is true then we assume
    // CSSStyleSheet is constructable.
    if (supportsAdoptingStyleSheets && this._styleSheet === undefined) {
      this._styleSheet = new CSSStyleSheet();
      this._styleSheet.replaceSync(this.cssText);
    }
    return this._styleSheet;
  }

  toString(): string {
    return this.cssText;
  }
}

const cssResultCache = new Map<string, CSSResult>();

const getCSSResult = (cssText: string): CSSResult => {
  let result = cssResultCache.get(cssText);
  if (result === undefined) {
    cssResultCache.set(
      cssText,
      (result = new CSSResult(cssText, constructionToken))
    );
  }
  return result;
};

const textFromCSSResult = (value: CSSResultGroup | number) => {
  if (value instanceof CSSResult) {
    return value.cssText;
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
 * Wrap a value for interpolation in a [[`css`]] tagged template literal.
 *
 * This is unsafe because untrusted CSS text can be used to phone home
 * or exfiltrate data to an attacker controlled site. Take care to only use
 * this with trusted input.
 */
export const unsafeCSS = (value: unknown) => {
  return getCSSResult(typeof value === 'string' ? value : String(value));
};

/**
 * Template tag which which can be used with LitElement's [[LitElement.styles |
 * `styles`]] property to set element styles. For security reasons, only literal
 * string values may be used. To incorporate non-literal values [[`unsafeCSS`]]
 * may be used inside a template string part.
 */
export const css = (
  strings: TemplateStringsArray,
  ...values: (CSSResultGroup | number)[]
): CSSResultGroup => {
  const cssText =
    strings.length === 1
      ? strings[0]
      : values.reduce(
          (acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1],
          strings[0]
        );
  return getCSSResult(cssText);
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
  styles: CSSResultFlatArray
) => {
  if (supportsAdoptingStyleSheets) {
    (renderRoot as ShadowRoot).adoptedStyleSheets = styles.map((s) =>
      s instanceof CSSStyleSheet ? s : s.styleSheet!
    );
  } else {
    styles.forEach((s) => {
      const style = document.createElement('style');
      style.textContent = (s as CSSResult).cssText;
      renderRoot.appendChild(style);
    });
  }
};

const cssResultFromStyleSheet = (sheet: CSSStyleSheet) => {
  let cssText = '';
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};

export const getCompatibleStyle = supportsAdoptingStyleSheets
  ? (s: CSSResultOrNative) => s
  : (s: CSSResultOrNative) =>
      s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;
