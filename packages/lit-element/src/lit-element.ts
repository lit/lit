/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * The main LitElement module, which defines the {@linkcode LitElement} base
 * class and related APIs.
 *
 *  LitElement components can define a template and a set of observed
 * properties. Changing an observed property triggers a re-render of the
 * element.
 *
 *  Import {@linkcode LitElement} and {@linkcode html} from this module to
 * create a component:
 *
 *  ```js
 * import {LitElement, html} from 'lit-element';
 *
 * class MyElement extends LitElement {
 *
 *   // Declare observed properties
 *   static get properties() {
 *     return {
 *       adjective: {}
 *     }
 *   }
 *
 *   constructor() {
 *     this.adjective = 'awesome';
 *   }
 *
 *   // Define the element's template
 *   render() {
 *     return html`<p>your ${adjective} template here</p>`;
 *   }
 * }
 *
 * customElements.define('my-element', MyElement);
 * ```
 *
 * `LitElement` extends {@linkcode ReactiveElement} and adds lit-html
 * templating. The `ReactiveElement` class is provided for users that want to
 * build their own custom element base classes that don't use lit-html.
 *
 * @packageDocumentation
 */
import {PropertyValues, ReactiveElement} from '@lit/reactive-element';
import {render, RenderOptions, noChange, RootPart} from 'lit-html';
export * from '@lit/reactive-element';
export * from 'lit-html';

import {LitUnstable} from 'lit-html';
import {ReactiveUnstable} from '@lit/reactive-element';

/**
 * Contains types that are part of the unstable debug API.
 *
 * Everything in this API is not stable and may change or be removed in the future,
 * even on patch releases.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Unstable {
  /**
   * When Lit is running in dev mode and `window.emitLitDebugLogEvents` is true,
   * we will emit 'lit-debug' events to window, with live details about the update and render
   * lifecycle. These can be useful for writing debug tooling and visualizations.
   *
   * Please be aware that running with window.emitLitDebugLogEvents has performance overhead,
   * making certain operations that are normally very cheap (like a no-op render) much slower,
   * because we must copy data and dispatch events.
   */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace DebugLog {
    export type Entry =
      | LitUnstable.DebugLog.Entry
      | ReactiveUnstable.DebugLog.Entry;
  }
}
/*
 * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
 * replaced at compile time by the munged name for object[property]. We cannot
 * alias this function, so we have to use a small shim that has the same
 * behavior when not compiling.
 */
/*@__INLINE__*/
const JSCompiler_renameProperty = <P extends PropertyKey>(
  prop: P,
  _obj: unknown
): P => prop;

const DEV_MODE = true;

let issueWarning: (code: string, warning: string) => void;

if (DEV_MODE) {
  // Ensure warnings are issued only 1x, even if multiple versions of Lit
  // are loaded.
  const issuedWarnings: Set<string | undefined> =
    (globalThis.litIssuedWarnings ??= new Set());

  // Issue a warning, if we haven't already.
  issueWarning = (code: string, warning: string) => {
    warning += ` See https://lit.dev/msg/${code} for more information.`;
    if (!issuedWarnings.has(warning)) {
      console.warn(warning);
      issuedWarnings.add(warning);
    }
  };
}

/**
 * Base element class that manages element properties and attributes, and
 * renders a lit-html template.
 *
 * To define a component, subclass `LitElement` and implement a
 * `render` method to provide the component's template. Define properties
 * using the {@linkcode LitElement.properties properties} property or the
 * {@linkcode property} decorator.
 */
export class LitElement extends ReactiveElement {
  // This property needs to remain unminified.
  static ['_$litElement$'] = true;

  /**
   * @category rendering
   */
  readonly renderOptions: RenderOptions = {host: this};

  private __childPart: RootPart | undefined = undefined;

  /**
   * @category rendering
   */
  protected override createRenderRoot() {
    const renderRoot = super.createRenderRoot();
    // When adoptedStyleSheets are shimmed, they are inserted into the
    // shadowRoot by createRenderRoot. Adjust the renderBefore node so that
    // any styles in Lit content render before adoptedStyleSheets. This is
    // important so that adoptedStyleSheets have precedence over styles in
    // the shadowRoot.
    this.renderOptions.renderBefore ??= renderRoot!.firstChild as ChildNode;
    return renderRoot;
  }

  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * @param changedProperties Map of changed properties with old values
   * @category updates
   */
  protected override update(changedProperties: PropertyValues) {
    // Setting properties in `render` should not trigger an update. Since
    // updates are allowed after super.update, it's important to call `render`
    // before that.
    const value = this.render();
    if (!this.hasUpdated) {
      this.renderOptions.isConnected = this.isConnected;
    }
    super.update(changedProperties);
    this.__childPart = render(value, this.renderRoot, this.renderOptions);
  }

  /**
   * Invoked when the component is added to the document's DOM.
   *
   * In `connectedCallback()` you should setup tasks that should only occur when
   * the element is connected to the document. The most common of these is
   * adding event listeners to nodes external to the element, like a keydown
   * event handler added to the window.
   *
   * ```ts
   * connectedCallback() {
   *   super.connectedCallback();
   *   addEventListener('keydown', this._handleKeydown);
   * }
   * ```
   *
   * Typically, anything done in `connectedCallback()` should be undone when the
   * element is disconnected, in `disconnectedCallback()`.
   *
   * @category lifecycle
   */
  override connectedCallback() {
    super.connectedCallback();
    this.__childPart?.setConnected(true);
  }

  /**
   * Invoked when the component is removed from the document's DOM.
   *
   * This callback is the main signal to the element that it may no longer be
   * used. `disconnectedCallback()` should ensure that nothing is holding a
   * reference to the element (such as event listeners added to nodes external
   * to the element), so that it is free to be garbage collected.
   *
   * ```ts
   * disconnectedCallback() {
   *   super.disconnectedCallback();
   *   window.removeEventListener('keydown', this._handleKeydown);
   * }
   * ```
   *
   * An element may be re-connected after being disconnected.
   *
   * @category lifecycle
   */
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.__childPart?.setConnected(false);
  }

  /**
   * Invoked on each update to perform rendering tasks. This method may return
   * any value renderable by lit-html's `ChildPart` - typically a
   * `TemplateResult`. Setting properties inside this method will *not* trigger
   * the element to update.
   * @category rendering
   */
  protected render(): unknown {
    return noChange;
  }
}

/**
 * Ensure this class is marked as `finalized` as an optimization ensuring
 * it will not needlessly try to `finalize`.
 *
 * Note this property name is a string to prevent breaking Closure JS Compiler
 * optimizations. See @lit/reactive-element for more information.
 */
(LitElement as unknown as Record<string, unknown>)[
  JSCompiler_renameProperty('finalized', LitElement)
] = true;

// Install hydration if available
globalThis.litElementHydrateSupport?.({LitElement});

// Apply polyfills if available
const polyfillSupport = DEV_MODE
  ? globalThis.litElementPolyfillSupportDevMode
  : globalThis.litElementPolyfillSupport;
polyfillSupport?.({LitElement});

/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * Private exports for use by other Lit packages, not intended for use by
 * external users.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports  mangled in the
 * client side code, we export a _$LE object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 *
 * This has a unique name, to disambiguate it from private exports in
 * lit-html, since this module re-exports all of lit-html.
 *
 * @private
 */
export const _$LE = {
  _$attributeToProperty: (
    el: LitElement,
    name: string,
    value: string | null
  ) => {
    // eslint-disable-next-line
    (el as any)._$attributeToProperty(name, value);
  },
  // eslint-disable-next-line
  _$changedProperties: (el: LitElement) => (el as any)._$changedProperties,
};

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
(globalThis.litElementVersions ??= []).push('4.0.1');
if (DEV_MODE && globalThis.litElementVersions.length > 1) {
  issueWarning!(
    'multiple-versions',
    `Multiple versions of Lit loaded. Loading multiple versions ` +
      `is not recommended.`
  );
}
