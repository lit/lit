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
import type {ThunkedRenderResult} from './render-result.js';

export type Constructor<T> = {new (): T};

const {attributeToProperty, changedProperties} = _$LE;

// We want consumers to be able to implement their own createRenderRoot
// and to detect whether it breaks during SSR. Due to this, we
// patch the createRenderRoot method on LitElement.
// If this method is not patched, the SSR call will fail, as adoptStyles
// is called, which will in turn call browser native APIs.
// TODO: Check if we could enable supportsAdoptingStyleSheets during SSR
// and polyfill CSSStyleSheet.
LitElement.prototype['createRenderRoot'] = function () {
  return (
    this.shadowRoot ??
    this.attachShadow(
      (this.constructor as typeof ReactiveElement).shadowRootOptions
    )
  );
};

/**
 * The render options for a specific element in LitElementRenderer.
 */
export interface LitElementRendererRenderOptions {
  /**
   * Whether to call connectedCallback during SSR.
   * @default false
   */
  connectedCallback?: boolean;
  /**
   * Whether to disable SSR for the element.
   * @default false
   */
  disableSsr?: boolean;
}

/**
 * ElementRenderer implementation for LitElements
 */
export class LitElementRenderer extends ElementRenderer {
  override element: LitElement;

  private _disabled = false;

  static override matchesClass(ctor: typeof HTMLElement) {
    // This property needs to remain unminified.
    return (ctor as unknown as typeof LitElement)['_$litElement$'];
  }

  /**
   * Configure options for specific elements.
   * Callbacks are called in order for each element being rendered and can be
   * used to configure options such as whether to call connectedCallback for
   * a given element or to disable SSR.
   *
   * @example
   *
   * ```ts
   * import {LitElementRenderer} from '@lit-labs/ssr';
   *
   * // Disable SSR for `my-element`.
   * LitElementRenderer.renderOptions.push(
   *   (element) => element.localName === 'my-element' ? {disableSsr: true} : undefined
   * );
   *
   * // Call connectedCallback for `my-element` by returning an options object with `connectedCallback` set to true.
   * LitElementRenderer.renderOptions.push(
   *   (element) => element.localName === 'my-element' ? {connectedCallback: true} : undefined
   * );
   * ```
   */
  static readonly renderOptions: ((
    element: LitElement
  ) => LitElementRendererRenderOptions | undefined)[] = [];

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
        const value = internals[ariaProp as keyof typeof ariaMixinAttributes];
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
    if (globalThis.litSsrCallConnectedCallback) {
      console.warn(
        'litSsrCallConnectedCallback is deprecated. ' +
          'Please use LitElementRenderer.renderOptions instead.'
      );
    }

    let renderOptions: LitElementRendererRenderOptions | undefined;
    for (const optionsCallback of LitElementRenderer.renderOptions) {
      const options = optionsCallback(this.element);
      if (options) {
        renderOptions = options;
        break;
      }
    }

    if (renderOptions?.disableSsr) {
      this._disabled = true;
      return;
    }

    if (
      globalThis.litSsrCallConnectedCallback ||
      renderOptions?.connectedCallback
    ) {
      // Prevent enabling asynchronous updating by overriding enableUpdating
      // with a no-op.
      this.element['enableUpdating'] = function () {};
      // We also depend on patching createRenderRoot, which is done above.
      try {
        this.element.connectedCallback();
      } catch (e) {
        const className = this.element.constructor.name;
        console.warn(
          `Calling ${className}.connectedCallback() resulted in a thrown ` +
            'error. Consider configuring `LitElementRenderer.renderOptions` ' +
            'to prevent calling connectedCallback for unsupported elements ' +
            'or add isServer checks to your code to prevent calling browser ' +
            'API during SSR.'
        );
        throw e;
      }
    }

    const propertyValues = changedProperties(this.element);
    // Call LitElement's `willUpdate` method.
    // Note, this method is required not to use DOM APIs.
    this.element?.['willUpdate'](propertyValues);
    // We are currently skipping the controller hook `hostUpdate`.
    // Reflect properties to attributes by calling into ReactiveElement's
    // update, which _only_ reflects attributes
    ReactiveElement.prototype['update'].call(this.element, propertyValues);
  }

  override attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ) {
    attributeToProperty(this.element as LitElement, name, value);
  }

  override renderShadow(
    renderInfo: RenderInfo
  ): ThunkedRenderResult | undefined {
    if (this._disabled) {
      return undefined;
    }

    const result: ThunkedRenderResult = [];
    // Render styles.
    const styles = (this.element.constructor as typeof LitElement)
      .elementStyles;
    if (styles !== undefined && styles.length > 0) {
      result.push('<style>');
      for (const style of styles) {
        result.push((style as CSSResult).cssText);
      }
      result.push('</style>');
    }
    // Render template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.push(() => renderValue((this.element as any).render(), renderInfo));
    return result;
  }

  override renderLight(renderInfo: RenderInfo): ThunkedRenderResult {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (this.element as any)?.renderLight();
    if (value) {
      return [() => renderValue(value, renderInfo)];
    } else {
      return [''];
    }
  }
}
