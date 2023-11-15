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
 * StyleDedupe is a utility that can be optionally passed to your SSR config to
 * inject a small amount of JavaScript on your page.
 *
 * Make sure that the same instance of `DeclarativeStyleDedupeUtility` is used
 * for a page.
 */
export class DeclarativeStyleDedupeUtility {
  private hasEmittedDeclaration = false;
  private readonly styleModuleTagName;
  private idCounter = 0;
  private styleToId = new Map<CSSResultOrNative, number>();

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

const supportsAdoptingStyleSheets = window.ShadowRoot &&
  (window.ShadyCSS === undefined || global.ShadyCSS.nativeShadow) &&
  'adoptedStyleSheets' in Document.prototype &&
  'replaceSync' in CSSStyleSheet.prototype;

class StyleModule extends HTMLElement {
    static styleCache = new Map();

    _cachedSS = undefined;
    get constructableStyleSheet() {
      if (this._cachedSS) {
        return this._cachedSS;
      }
      this._cachedSS = new CSSStyleSheet();
      this._cachedSS.replaceSync(this.children[0].textContent);
      return this._cachedSS;
    }

    connectedCallback() {
      const styleId = this.getAttribute('style-id');
      const cachedStyleSheet = StyleModule.styleCache.get(styleId);
      if (cachedStyleSheet == null) {
        StyleModule.styleCache.set(styleId, this);
        return;
      }

      if (supportsAdoptingStyleSheets) {
        const styleSheet = cachedStyleSheet.constructableStyleSheet;
        this.parentNode.adoptedStyleSheets.push(styleSheet);
      } else {
        const clonedStyles = cachedStyleSheet.children[0].cloneNode(true);
        this.append(clonedStyles);
      }
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
      yield `<${this.styleModuleTagName} style-id="${styleHashId}" style="display:none;">`;
      if (styleHashId === this.idCounter) {
        this.idCounter++; // Increment idCounter so we only generate styles once.
        yield '<style>';
        yield (style as CSSResult).cssText;
        yield '</style>';
      }
      yield `</${this.styleModuleTagName}>`;
    }
  }
}
