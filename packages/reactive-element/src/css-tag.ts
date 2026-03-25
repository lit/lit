/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

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

/**
 * A container for a string of CSS text, that may be used to create a CSSStyleSheet.
 *
 * CSSResult is the return value of `css`-tagged template literals and
 * `unsafeCSS()`. In order to ensure that CSSResults are only created via the
 * `css` tag and `unsafeCSS()`, CSSResult cannot be constructed directly.
 */
export class CSSResult {
  // This property needs to remain unminified.
  _$cssResult$ = true;
  readonly cssText: string;
  private _styleSheet?: CSSStyleSheet;

  private constructor(cssText: string, safeToken: symbol) {
    if (safeToken !== constructionToken) {
      throw new Error(
        'CSSResult is not constructable. Use `unsafeCSS` or `css` instead.'
      );
    }
    this.cssText = cssText;
  }

  // This is a getter so that it's lazy. In practice, this means stylesheets
  // are not created until the first element instance is made.
  get styleSheet(): CSSStyleSheet | undefined {
    if (this._styleSheet === undefined) {
      (this._styleSheet = new CSSStyleSheet()).replaceSync(this.cssText);
    }
    return this._styleSheet;
  }

  toString(): string {
    // TODO (justinfagnani): Do we need this?
    return this.cssText;
  }
}

type ConstructableCSSResult = CSSResult & {
  new (cssText: string, safeToken: symbol): CSSResult;
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
  return new (CSSResult as ConstructableCSSResult)(cssText, constructionToken);
};

/**
 * Applies the given styles to a `shadowRoot`.
 */
export const adoptStyles = (
  renderRoot: ShadowRoot,
  styles: Array<CSSResultOrNative>
) => {
  renderRoot.adoptedStyleSheets = styles.map((s) =>
    s instanceof CSSStyleSheet ? s : s.styleSheet!
  );
};
