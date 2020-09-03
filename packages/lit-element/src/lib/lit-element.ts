/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
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
 * `LitElement` extends [[`UpdatingElement`]] and adds lit-html templating.
 * The `UpdatingElement` class is provided for users that want to build
 * their own custom element base classes that don't use lit-html.
 *
 * @packageDocumentation
 */
import {PropertyValues, UpdatingElement} from './updating-element.js';
import {render, RenderOptions} from 'lit-html';
import {supportsAdoptingStyleSheets, CSSResult, unsafeCSS} from './css-tag.js';

export * from './updating-element.js';
export {html, svg, TemplateResult} from 'lit-html';
export * from './css-tag.js';

declare global {
  interface Window {
    litElementVersions: string[];
  }
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time
(window['litElementVersions'] || (window['litElementVersions'] = [])).push(
  '2.4.0'
);

export type CSSResultOrNative = CSSResult | CSSStyleSheet;

export interface CSSResultArray
  extends Array<CSSResultOrNative | CSSResultArray> {}

/**
 * Sentinal value used to avoid calling lit-html's render function when
 * subclasses do not implement `render`
 */
const renderNotImplemented = {};

/**
 * Base element class that manages element properties and attributes, and
 * renders a lit-html template.
 *
 * To define a component, subclass `LitElement` and implement a
 * `render` method to provide the component's template. Define properties
 * using the [[`properties`]] property or the [[`property`]] decorator.
 */
export class LitElement extends UpdatingElement {
  /**
   * Ensure this class is marked as `finalized` as an optimization ensuring
   * it will not needlessly try to `finalize`.
   *
   * Note this property name is a string to prevent breaking Closure JS Compiler
   * optimizations. See updating-element.ts for more information.
   */
  protected static ['finalized'] = true;

  /**
   * Reference to the underlying library method used to render the element's
   * DOM. By default, points to the `render` method from lit-html's render
   * module.
   *
   * This  property should not be confused with the `render` instance method,
   * which should be overridden to define a template for the element.
   *
   * @nocollapse
   */
  static render: (
    result: unknown,
    container: HTMLElement | DocumentFragment,
    options: RenderOptions
  ) => void = render;

  /**
   * Array of styles to apply to the element. The styles should be defined
   * using the [[`css`]] tag function or via constructible stylesheets.
   */
  static styles?: CSSResultOrNative | CSSResultArray;
  private static elementStyles?: CSSResultArray;

  /**
   * Takes the styles the user supplied via the `static styles` property and
   * returns the array of styles to apply to the element.
   * Override this method to integrate into a style management system.
   *
   * Styles are deduplicated preserving the _last_ instance in the list. This
   * is a performance optimization to avoid duplicated styles that can occur
   * especially when composing via subclassing. The last item is kept to try
   * to preserve the cascade order with the assumption that it's most important
   * that last added styles override previous styles.
   *
   * @nocollapse
   */
  protected static getStyles(
    styles?: CSSResultOrNative | CSSResultArray
  ): CSSResultArray {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      const addStyles = (
        stylesList: CSSResultArray,
        set: Set<CSSResultOrNative>
      ): Set<CSSResultOrNative> =>
        stylesList.reduceRight(
          (set: Set<CSSResultOrNative>, s) =>
            // Note: On IE set.add() does not return the set
            Array.isArray(s) ? addStyles(s, set) : (set.add(s), set),
          set
        );
      // Array.from does not work on Set in IE, otherwise return
      // Array.from(addStyles(styles, new Set<CSSResult>())).reverse()
      const set = addStyles(styles, new Set<CSSResultOrNative>());
      set.forEach((v) => elementStyles.unshift(v));
    } else if (styles !== undefined) {
      elementStyles.push(styles);
    }

    // Ensure that there are no invalid CSSStyleSheet instances here. They are
    // invalid in two conditions.
    // (1) the sheet is non-constructible (`sheet` of a HTMLStyleElement), but
    //     this is impossible to check except via .replaceSync or use
    // (2) the ShadyCSS polyfill is enabled (:. supportsAdoptingStyleSheets is
    //     false)
    return elementStyles.map((s) => {
      if (s instanceof CSSStyleSheet && !supportsAdoptingStyleSheets) {
        // Flatten the cssText from the passed constructible stylesheet (or
        // undetectable non-constructible stylesheet). The user might have
        // expected to update their stylesheets over time, but the alternative
        // is a crash.
        const cssText = Array.prototype.slice
          .call(s.cssRules)
          .reduce((css, rule) => css + rule.cssText, '');
        return unsafeCSS(cssText);
      }
      return s;
    });
  }

  protected static finalize() {
    if (!this.hasFinalized) {
      this.elementStyles = this.getStyles(this.styles);
      super.finalize();
    }
  }

  /**
   * Node or ShadowRoot into which element DOM should be rendered. Defaults
   * to an open shadowRoot.
   */
  readonly renderRoot!: HTMLElement | DocumentFragment;

  /**
   * Performs element initialization. By default this calls
   * [[`createRenderRoot`]] to create the element [[`renderRoot`]] node and
   * captures any pre-set values for registered properties.
   */
  protected initialize() {
    super.initialize();
    (this as {
      renderRoot: Element | DocumentFragment;
    }).renderRoot = this.createRenderRoot();
    this.adoptStyles((this.constructor as typeof LitElement).elementStyles!);
  }

  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   * @returns {Element|DocumentFragment} Returns a node into which to render.
   */
  protected createRenderRoot(): Element | ShadowRoot {
    return this.attachShadow({mode: 'open'});
  }

  /**
   * Applies the given styles to the element. Styling is applied to the element
   * only if the `renderRoot` is a `shadowRoot`. If the `rendeRoot` is not
   * a `shadowRoot`, this method may be overridden to apply styling in another
   * way. Styling will apply using `shadowRoot.adoptedStyleSheets` where
   * available and will fallback otherwise. When Shadow DOM is available but
   * `adoptedStyleSheets` is not, styles are appended to the the `shadowRoot`
   * to [mimic spec behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
   */
  protected adoptStyles(styles: CSSResultArray) {
    // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
    // element's getRootNode(). While this could be done, we're choosing not to
    // support this now since it would require different logic around de-duping.
    if (!(this.renderRoot instanceof window.ShadowRoot)) {
      return;
    }
    if (supportsAdoptingStyleSheets) {
      (this.renderRoot as ShadowRoot).adoptedStyleSheets = styles.map((s) =>
        s instanceof CSSStyleSheet ? s : (s as CSSResult).styleSheet!
      );
    } else {
      styles.forEach((s) => {
        const style = document.createElement('style');
        style.textContent = (s as CSSResult).cssText;
        this.renderRoot.appendChild(style);
      });
    }
  }

  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * @param changedProperties Map of changed properties with old values
   */
  protected update(changedProperties: PropertyValues) {
    // Setting properties in `render` should not trigger an update. Since
    // updates are allowed after super.update, it's important to call `render`
    // before that.
    const templateResult = this.render();
    super.update(changedProperties);
    // If render is not implemented by the component, don't call lit-html render
    if (templateResult !== renderNotImplemented) {
      (this.constructor as typeof LitElement).render(
        templateResult,
        this.renderRoot,
        {eventContext: this}
      );
    }
  }

  /**
   * Invoked on each update to perform rendering tasks. This method may return
   * any value renderable by lit-html's `NodePart` - typically a
   * `TemplateResult`. Setting properties inside this method will *not* trigger
   * the element to update.
   */
  protected render(): unknown {
    return renderNotImplemented;
  }
}
