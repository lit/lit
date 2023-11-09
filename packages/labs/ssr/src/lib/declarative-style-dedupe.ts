/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {digestForTemplateResult} from '@lit-labs/ssr-client';
import {CSSResult, CSSResultOrNative, TemplateResult} from 'lit';

/**
 * StyleDedupe is a utility that can be optionally passed to your
 * SSR
 */
export class DeclarativeStyleDedupeUtility {
  seenStyles = new Set<string>();
  private hasEmittedDeclaration = false;

  emitCustomElementDeclaration(): string {
    if (this.hasEmittedDeclaration) {
      return '';
    }
    this.hasEmittedDeclaration = true;
    return `
<script>

class StyleModule extends HTMLElement {
    static styleCache = new Map();

    connectedCallback() {
        // This attribute tells us that we expect the child styles
        // to be cached.
        if (this.hasAttribute("need-cached-styles")) {
            return this.parsedCallback();
        }

        const obs = new MutationObserver(() => {
            obs.disconnect();
            this.parsedCallback();
        });
        obs.observe(this.parentNode, {childList: true, subtree: true});
    }

    parsedCallback() {
        const styleId = this.getAttribute('style-id');
        if (this.children.length === 1) {
            const styleEl = this.children[0];
            StyleModule.styleCache.set(styleId, styleEl.textContent);
            console.log('setting styleId', styleId, styleEl.textContent);
            return;
          } else if (this.children.length !== 0) {
            throw new Error("Unexpected length of children in style-module");
          }
        const styleContents = StyleModule.styleCache.get(styleId);
        const styleEl = document.createElement('style');
        styleEl.textContent = styleContents;
        this.append(styleEl);
    }
}
customElements.define('style-module', StyleModule);
</script>`;
  }

  getStyleHash(styles: CSSResultOrNative[]): string {
    const staticStrings = [];
    for (const style of styles) {
      staticStrings.push((style as CSSResult).cssText);
    }
    // Spoofing TemplateResult because `digestForTemplateResult` only cares
    // about the static strings array.
    const digest = digestForTemplateResult({
      strings: staticStrings,
    } as unknown as TemplateResult);
    return digest;
  }

  openingTag(styleId: string) {
    if (styleId.includes('"')) {
      throw new Error(`Digest cannot have a double quote`);
    }
    const needCachedStyles = this.seenStyles.has('styleId')
      ? 'need-cached-styles'
      : '';
    return `<style-module style-id="${styleId}" ${needCachedStyles}>`;
  }

  closingTag() {
    return `</style-module>`;
  }

  markStyleDigestIdSeen(styleId: string) {
    this.seenStyles.add(styleId);
  }
}
