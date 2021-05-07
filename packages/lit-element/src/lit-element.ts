/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * The main LitElement module, which defines the [[`LitElement`]] base class and
 * related APIs.
 *
 *  LitElement components can define a template and a set of observed
 * properties. Changing an observed property triggers a re-render of the
 * element.
 *
 *  Import [[`LitElement`]] and [[`html`]] from this module to create a
 * component:
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
 * `LitElement` extends [[`ReactiveElement`]] and adds lit-html templating.
 * The `ReactiveElement` class is provided for users that want to build
 * their own custom element base classes that don't use lit-html.
 *
 * @packageDocumentation
 */
import {PropertyValues, ReactiveElement} from '@lit/reactive-element';
import {render, RenderOptions, noChange, ChildPart} from 'lit-html';
export * from '@lit/reactive-element';
export * from 'lit-html';

// For backwards compatibility export ReactiveElement as UpdatingElement. Note,
// IE transpilation requires exporting like this.
export const UpdatingElement = ReactiveElement;

const DEV_MODE = true;

declare global {
  interface Window {
    litElementVersions: string[];
  }
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
((globalThis as any)['litElementVersions'] ??= []).push('3.0.0-rc.2');

/**
 * Base element class that manages element properties and attributes, and
 * renders a lit-html template.
 *
 * To define a component, subclass `LitElement` and implement a
 * `render` method to provide the component's template. Define properties
 * using the [[`properties`]] property or the [[`property`]] decorator.
 */
export class LitElement extends ReactiveElement {
  /**
   * Ensure this class is marked as `finalized` as an optimization ensuring
   * it will not needlessly try to `finalize`.
   *
   * Note this property name is a string to prevent breaking Closure JS Compiler
   * optimizations. See @lit/reactive-element for more information.
   */
  protected static ['finalized'] = true;

  static _$litElement$ = true;

  /**
   * @category rendering
   */
  readonly renderOptions: RenderOptions = {host: this};

  private __childPart: ChildPart | undefined = undefined;

  /**
   * @category rendering
   */
  protected createRenderRoot() {
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
  protected update(changedProperties: PropertyValues) {
    // Setting properties in `render` should not trigger an update. Since
    // updates are allowed after super.update, it's important to call `render`
    // before that.
    const value = this.render();
    super.update(changedProperties);
    this.__childPart = render(value, this.renderRoot, this.renderOptions);
  }

  // TODO(kschaaf): Consider debouncing directive disconnection so element moves
  // do not thrash directive callbacks
  // https://github.com/lit/lit/issues/1457
  /**
   * @category lifecycle
   */
  connectedCallback() {
    super.connectedCallback();
    this.__childPart?.setConnected(true);
  }

  /**
   * @category lifecycle
   */
  disconnectedCallback() {
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

// Install hydration if available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['litElementHydrateSupport']?.({LitElement});

// Apply polyfills if available
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['litElementPlatformSupport']?.({LitElement});

// DEV mode warnings
if (DEV_MODE) {
  // Note, for compatibility with closure compilation, this access
  // needs to be as a string property index.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (LitElement as any)['finalize'] = function (this: typeof LitElement) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalized = (ReactiveElement as any).finalize.call(this);
    if (!finalized) {
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const warnRemoved = (obj: any, name: string) => {
      if (obj[name] !== undefined) {
        console.warn(
          `\`${name}\` is implemented. It ` +
            `has been removed from this version of LitElement. `
          // TODO(sorvell): add link to changelog when location has stabilized.
          // + See the changelog at https://github.com/lit/lit/blob/main/packages/lit-element/CHANGELOG.md`
        );
      }
    };
    [`render`, `getStyles`].forEach((name: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warnRemoved(this as any, name)
    );
    [`adoptStyles`].forEach((name: string) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      warnRemoved(this.prototype as any, name)
    );
    return true;
  };
}

/**
 * END USERS SHOULD NOT RELY ON THIS OBJECT.
 *
 * Private exports for use by other Lit packages, not intended for use by
 * external users.
 *
 * We currently do not make a mangled rollup build of the lit-ssr code. In order
 * to keep a number of (otherwise private) top-level exports  mangled in the
 * client side code, we export a _Φ object containing those members (or
 * helper methods for accessing private fields of those members), and then
 * re-export them for use in lit-ssr. This keeps lit-ssr agnostic to whether the
 * client-side code is being used in `dev` mode or `prod` mode.
 *
 * This has a unique name, to disambiguate it from private exports in
 * lit-html, since this module re-exports all of lit-html.
 *
 * @private
 */
export const _Φ = {
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
