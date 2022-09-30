/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

const NODE_MODE = false;
const global = NODE_MODE ? globalThis : window;

/**
 * Whether the current browser supports `adoptedStyleSheets`.
 */
export const supportsAdoptingStyleSheets =
  global.ShadowRoot &&
  (global.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) &&
  'adoptedStyleSheets' in Document.prototype &&
  'replace' in CSSStyleSheet.prototype;

/**
 * A CSSResult, CSSStyleSheet, HTMLStyleElement, or HTMLLinkElement.
 *
 * In browsers that support constructible CSS style sheets, CSSStyleSheet
 * objects can be used for styling.
 */
export type CSSResultOrNative =
  | CSSResult
  | CSSStyleSheet
  | HTMLStyleElement
  | HTMLLinkElement;

export type CSSResultArray = Array<CSSResultOrNative | CSSResultArray>;

/**
 * A single CSSResult, CSSStyleSheet, or style element, or an array or nested
 * arrays of those.
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

// Type guard for CSSResult
const isCSSResult = (value: unknown): value is CSSResult =>
  (value as CSSResult)['_$cssResult$'] === true;

// Type guard for style element
const isStyleEl = (
  value: unknown
): value is HTMLStyleElement | HTMLLinkElement => {
  const {localName} = value as HTMLElement;
  return localName === 'style' || localName === 'link';
};

const textFromCSSResult = (value: CSSResultGroup | number) => {
  // This property needs to remain unminified.
  if (isCSSResult(value)) {
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

// Markers used to determine where style elements have been inserted in the
// shadowRoot so that they can be easily updated.
const styleMarkersMap = new WeakMap<ShadowRoot, [Comment, Comment]>();
const getStyleMarkers = (renderRoot: ShadowRoot) => {
  let markers = styleMarkersMap.get(renderRoot);
  if (markers === undefined) {
    styleMarkersMap.set(
      renderRoot,
      (markers = [
        renderRoot.appendChild(document.createComment('')),
        renderRoot.appendChild(document.createComment('')),
      ])
    );
  }
  return markers;
};

/**
 * Clears any nodes between the given nodes. Used to remove style elements that
 * have been inserted via `adoptStyles`. This allows ensures any previously
 * applied styling is not re-applied.
 */
const removeNodesBetween = (start: Node, end: Node) => {
  let n = start.nextSibling;
  while (n && n !== end) {
    const next = n.nextSibling;
    n.remove();
    n = next;
  }
};

/**
 * Applies the optional globally set `litNonce` to an element.
 */
const applyNonce = (el: HTMLElement) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nonce = (window as any)['litNonce'];
  if (nonce !== undefined) {
    el.setAttribute('nonce', nonce);
  }
};

/**
 * Applies the given styles to a `shadowRoot`. When Shadow DOM is
 * available but `adoptedStyleSheets` is not, styles are appended to the
 * `shadowRoot` to [mimic spec behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
 * Note, when shimming is used, any styles that are subsequently placed into
 * the shadowRoot should be placed *before* any shimmed adopted styles. This
 * will match spec behavior that gives adopted sheets precedence over styles in
 * shadowRoot.
 *
 * The given styles can be CSSResult, CSSStyleSheet, HTMLStyleElement, or
 * HTMLLinkElements. If a CSSStyleSheet is supplied, it should be a constructed
 * stylesheet.
 *
 * Optionally preserves any existing adopted styles.
 */
export const adoptStyles = (
  renderRoot: ShadowRoot,
  styles: CSSResultOrNative[],
  preserveExisting = false
) => {
  // Get a set of sheets and elements to apply.
  const elements: Array<HTMLStyleElement | HTMLLinkElement> = [];
  const sheets: CSSStyleSheet[] = styles
    .map((s) => getSheetOrElementToApply(s, renderRoot))
    .filter((s): s is CSSStyleSheet => !(isStyleEl(s) && elements.push(s)));
  // By default, clear any existing styling.
  if (supportsAdoptingStyleSheets && (sheets.length || !preserveExisting)) {
    renderRoot.adoptedStyleSheets = [
      ...(preserveExisting ? renderRoot.adoptedStyleSheets : []),
      ...sheets,
    ];
  }
  // Remove / Apply any style elements
  if (!preserveExisting && styleMarkersMap.has(renderRoot)) {
    removeNodesBetween(...getStyleMarkers(renderRoot));
  }
  if (elements.length) {
    const [, end] = getStyleMarkers(renderRoot);
    // TODO: The following is slightly less code but not supported in ShadyDOM's
    // `noPatch`mode:
    // end.before(...elements);
    elements.forEach((n) => renderRoot.insertBefore(n, end));
  }
};

/**
 * Returns an array of adopted styles for the given `renderRoot`. The adopted
 * styles can include both style sheet objects applied via `adoptedStyleSheets`
 * and style elements (`<style>` or `<link>`) embedded in the shadowRoot itself.
 */
export const getAdoptedStyles = (renderRoot: ShadowRoot) => {
  const adopted: CSSResultOrNative[] = [
    ...(renderRoot?.adoptedStyleSheets ?? []),
  ];
  if (styleMarkersMap.has(renderRoot)) {
    const [start, end] = getStyleMarkers(renderRoot);
    for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) {
      adopted.push(n as HTMLStyleElement | HTMLLinkElement);
    }
  }
  return adopted;
};

/**
 * Gets compatible style object (sheet or element) which can be applied to a
 * shadowRoot.
 */
const getSheetOrElementToApply = (
  styling: CSSResultOrNative,
  renderRoot: ShadowRoot
) => {
  // Converts to a CSSResult if needed. This is needed when forcing polyfilled
  // ShadyDOM/CSS on a browser that supports constructible stylesheets.
  if (styling instanceof CSSStyleSheet) {
    styling = getCompatibleStyle(styling);
  }
  // If it's an element, just clone it.
  if (isStyleEl(styling) && styling.parentNode !== renderRoot) {
    const s = styling.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;
    applyNonce(s);
    return s;
    // If it's a cssResult, return the stylesheet or a style element
  } else if (isCSSResult(styling)) {
    if (styling.styleSheet !== undefined) {
      return styling.styleSheet;
    } else {
      const s = document.createElement('style');
      s.textContent = styling.cssText;
      applyNonce(s);
      return s;
    }
  }
  // Otherwise, it should be a constructed stylesheet or elements already
  // in the root
  return styling;
};

const cssResultFromStyleSheet = (sheet: CSSStyleSheet) => {
  let cssText = '';
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};

/**
 * Given a CSSStylesheet or CSSResult, converts from CSSStyleSheet to CSSResult
 * if the browser does not support `adoptedStyleSheets`.
 */
export const getCompatibleStyle =
  supportsAdoptingStyleSheets ||
  (NODE_MODE && global.CSSStyleSheet === undefined)
    ? (s: CSSResultOrNative) => s
    : (s: CSSResultOrNative) =>
        s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;
