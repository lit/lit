/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ElementRenderer} from './element-renderer.js';
import {LitElement, CSSResult, ReactiveElement} from 'lit';
import {_$LE} from 'lit-element/private-ssr-support.js';
import {
  ariaMixinAttributes,
  HYDRATE_INTERNALS_ATTR_PREFIX,
} from '@lit-labs/ssr-dom-shim';
import {renderValue} from './render-value.js';
import type {RenderInfo} from './render-value.js';
import type {RenderResult} from './render-result.js';

export type Constructor<T> = {new (): T};

const {attributeToProperty, changedProperties} = _$LE;

/**
 * ElementRenderer implementation for LitElements
 */
export class LitElementRenderer extends ElementRenderer {
  override element: LitElement;

  static override matchesClass(ctor: typeof HTMLElement) {
    // This property needs to remain unminified.
    return (ctor as unknown as typeof LitElement)['_$litElement$'];
  }

  constructor(tagName: string) {
    super(tagName);
    this.element = new (customElements.get(this.tagName)!)() as LitElement;

    // Reflect internals AOM attributes back to the DOM prior to hydration to
    // ensure search bots can accurately parse element semantics prior to
    // hydration. This is called whenever an instance of ElementInternals is
    // created on an element to wire up the getters/setters for the ARIAMixin
    // properties.
    const internals = (
      this.element as object as {__internals: ElementInternals}
    ).__internals;
    if (internals) {
      for (const [ariaProp, ariaAttribute] of Object.entries(
        ariaMixinAttributes
      )) {
        const value = internals[ariaProp as keyof ARIAMixin];
        if (value && !this.element.hasAttribute(ariaAttribute)) {
          this.element.setAttribute(ariaAttribute, value);
          this.element.setAttribute(
            `${HYDRATE_INTERNALS_ATTR_PREFIX}${ariaAttribute}`,
            value
          );
        }
      }
    }
  }

  override get shadowRootOptions() {
    return (
      (this.element.constructor as typeof LitElement).shadowRootOptions ??
      super.shadowRootOptions
    );
  }

  override connectedCallback() {
    // Call LitElement's `willUpdate` method.
    // Note, this method is required not to use DOM APIs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.element as any)?.willUpdate(changedProperties(this.element as any));
    // Reflect properties to attributes by calling into ReactiveElement's
    // update, which _only_ reflects attributes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ReactiveElement.prototype as any).update.call(this.element);
  }

  override attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ) {
    attributeToProperty(this.element as LitElement, name, value);
  }

  override *renderShadow(renderInfo: RenderInfo): RenderResult {
    // Render styles.
    const styles = (this.element.constructor as typeof LitElement)
      .elementStyles;
    if (styles !== undefined && styles.length > 0) {
      yield '<style>';
      for (const style of styles) {
        yield (style as CSSResult).cssText;
      }
      yield '</style>';
    }
    // Render template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yield* renderValue((this.element as any).render(), renderInfo);
  }

  override *renderLight(renderInfo: RenderInfo): RenderResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (this.element as any)?.renderLight();
    if (value) {
      yield* renderValue(value, renderInfo);
    } else {
      yield '';
    }
  }
}
