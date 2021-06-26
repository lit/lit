/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const extraGlobals = window as LitExtraGlobals;

/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
export const supportsAdoptingStyleSheets =
  window.ShadowRoot &&
  (extraGlobals.ShadyCSS === undefined || extraGlobals.ShadyCSS.nativeShadow) &&
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

const styleSheetCache = new Map<string, CSSStyleSheet>();

/**
 * A container for a string of CSS text, that may be used to create a CSSStyleSheet.
 *
 * CSSResult is the return value of `css`-tagged template literals and
 * `unsafeCSS()`. In order to ensure that CSSResults are only created via the
 * `css` tag and `unsafeCSS()`, CSSResult cannot be constructed directly.
 */
export class CSSResult {
  _$cssResult$ = true;
  readonly cssText: string;

  private constructor(cssText: string, safeToken: symbol) {
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
    let styleSheet = styleSheetCache.get(this.cssText);
    if (supportsAdoptingStyleSheets && styleSheet === undefined) {
      styleSheetCache.set(this.cssText, (styleSheet = new CSSStyleSheet()));
      styleSheet.replaceSync(this.cssText);
    }
    return styleSheet;
  }

  toString(): string {
    return this.cssText;
  }
}

type ConstructableCSSResult = CSSResult & {
  new (cssText: string, safeToken: symbol): CSSResult;
};

const textFromCSSResult = (value: CSSResultGroup | number) => {
  if ((value as CSSResult)._$cssResult$ === true) {
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
 * Wrap a value for interpolation in a [[`css`]] tagged template literal.
 *
 * This is unsafe because untrusted CSS text can be used to phone home
 * or exfiltrate data to an attacker controlled site. Take care to only use
 * this with trusted input.
 */
export const unsafeCSS = (value: unknown) =>
  new (CSSResult as ConstructableCSSResult)(
    typeof value === 'string' ? value : String(value),
    constructionToken
  );

/**
 * A template literal tag which can be used with LitElement's
 * [[LitElement.styles | `styles`]] property to set element styles.
 *
 * For security reasons, only literal string values and number may be used in
 * embedded expressions. To incorporate non-literal values [[`unsafeCSS`]] may
 * be used inside an expression.
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
  return new (CSSResult as ConstructableCSSResult)(cssText, constructionToken);
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
