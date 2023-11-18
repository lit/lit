/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {CSSResult, CSSResultOrNative} from 'lit';
import {RenderResult} from './render-result.js';

export interface Options {
  /**
   * To dedupe styles on your SSR'd page, the DeclarativeStyleDedupeUtility
   * injects a global custom element onto your page. By default it is named
   * `<lit-ssr-style-dedupe>`, but the name can be customized via the `tagName`
   * option.
   */
  tagName?: string;
}

/**
 * DeclarativeStyleDedupeUtility is a utility that can be optionally passed to
 * your SSR config to inject a small amount of JavaScript on your page which
 * will de-dupe SSR'd styles, and provide user-land functionality in absence of
 * platform behavior (https://github.com/WICG/webcomponents/issues/939)
 *
 * Make sure that the same instance of `DeclarativeStyleDedupeUtility` is used
 * for a page, and use `emitCustomElementDeclaration` to insert the script tag
 * helper before any styles are encountered.
 */
export class DeclarativeStyleDedupeUtility {
  private hasEmittedDeclaration = false;
  private readonly styleModuleTagName;
  private idCounter = 0;
  private styleToId = new Map<CSSResultOrNative, number>();

  // This is used only in tests to force the fallback behavior of the deduping
  // custom element. The fallback behavior clones style elements (instead of
  // adopting constructable stylesheets).
  private testOnlyTurnOffSupportsAdoptingStyleSheets = false;

  constructor(opts?: Options) {
    this.styleModuleTagName = opts?.tagName ?? 'lit-ssr-style-dedupe';
  }

  emitCustomElementDeclaration(): string {
    if (this.hasEmittedDeclaration) {
      return '';
    }
    this.hasEmittedDeclaration = true;
    return `
<script>
(function() {
if (customElements.get('${this.styleModuleTagName}')) return;

const supportsAdoptingStyleSheets = ${
      this.testOnlyTurnOffSupportsAdoptingStyleSheets ? 'false && ' : ''
    }window.ShadowRoot &&
  (window.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) &&
  'adoptedStyleSheets' in Document.prototype &&
  'replaceSync' in CSSStyleSheet.prototype;

class StyleModule extends HTMLElement {
    static styleCache = new Map();

    _cachedStyleElement = undefined;
    _cachedSS = undefined;
    get constructableStyleSheet() {
      if (this._cachedSS) {
        return this._cachedSS;
      }
      this._cachedSS = new CSSStyleSheet();
      this._cachedSS.replaceSync(this._cachedStyleElement.textContent);
      this._cachedStyleElement.remove();
      this._cachedStyleElement = undefined;
      return this._cachedSS;
    }

    connectedCallback() {
      const styleId = this.getAttribute('style-id');
      let cachedStyleSheet = StyleModule.styleCache.get(styleId);
      let definitionEl = false;
      if (cachedStyleSheet == null) {
        StyleModule.styleCache.set(styleId, (cachedStyleSheet = this));
        // Reference the styles.
        this._cachedStyleElement = this.previousElementSibling;
        definitionEl = true;
      }

      if (supportsAdoptingStyleSheets) {
        const styleSheet = cachedStyleSheet.constructableStyleSheet;
        this.parentNode.adoptedStyleSheets.push(styleSheet);
      } else if (!definitionEl) {
        // Only copy the styles for subsequent instances of the styles.
        const clonedStyles = cachedStyleSheet._cachedStyleElement.cloneNode(true);
        this.before(clonedStyles);
      }
      this.remove();
    }
}
customElements.define('${this.styleModuleTagName}', StyleModule);
})();
</script>`;
  }

  private getStyleHash(style: CSSResultOrNative): number {
    const maybeHash = this.styleToId.get(style);
    if (maybeHash !== undefined) {
      return maybeHash;
    }
    this.styleToId.set(style, ++this.idCounter);
    return this.idCounter;
  }

  *renderDedupedStyles(styles: CSSResultOrNative[]): RenderResult {
    for (const style of styles) {
      const styleHashId = this.getStyleHash(style);
      if (styleHashId === this.idCounter) {
        this.idCounter++; // Increment idCounter so we only generate styles once.
        yield '<style>';
        yield (style as CSSResult).cssText;
        yield '</style>';
      }

      yield `<${this.styleModuleTagName} style-id="${styleHashId}" style="display:none;"></${this.styleModuleTagName}>`;
    }
  }
}
