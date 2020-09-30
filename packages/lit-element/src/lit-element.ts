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
import {PropertyValues, UpdatingElement} from './lib/updating-element.js';
import {render, RenderOptions} from 'lit-html';
import {
  supportsAdoptingStyleSheets,
  CSSResult,
  CSSResultGroup,
  CSSResultOrNative,
  unsafeCSS,
} from './lib/css-tag.js';

export * from './lib/updating-element.js';
export {html, svg, TemplateResult} from 'lit-html';
export * from './lib/css-tag.js';

const DEV_MODE = true;
if (DEV_MODE) {
  console.warn('lit-element is in dev mode. Not recommended for production!');
}

declare global {
  interface Window {
    litElementVersions: string[];
  }
}

// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for LitElement usage.
// TODO(justinfagnani): inject version number at build time
(window['litElementVersions'] || (window['litElementVersions'] = [])).push(
  '3.0.0-pre.1'
);

type CSSResultFlatArray = CSSResultOrNative[];

export type CSSResultArray = Array<CSSResultOrNative | CSSResultArray>

/**
 * Sentinal value used to avoid calling lit-html's render function when
 * subclasses do not implement `render`
 */
const renderNotImplemented = {};

const cssResultFromStyleSheet = (sheet: CSSStyleSheet) => {
  let cssText = '';
  for (const rule of sheet.cssRules) {
    cssText += rule.cssText;
  }
  return unsafeCSS(cssText);
};

const getCompatibleStyle = supportsAdoptingStyleSheets
  ? (s: CSSResultOrNative) => s
  : (s: CSSResultOrNative) =>
      s instanceof CSSStyleSheet ? cssResultFromStyleSheet(s) : s;

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
  static styles?: CSSResultGroup;
  private static _elementStyles?: CSSResultFlatArray;

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
  protected static finalizeStyles(styles?: CSSResultGroup): CSSResultFlatArray {
    const elementStyles = [];
    if (Array.isArray(styles)) {
      // Dedupe the flattened array in reverse order to preserve the last items.
      // TODO(sorvell): casting to Array<unknown> works around TS error that
      // appears to come from trying to flatten a type CSSResultArray.
      const set = new Set((styles as Array<unknown>).flat(Infinity).reverse());
      // Then preserve original order by adding the set items in reverse order.
      for (const s of set) {
        elementStyles.unshift(getCompatibleStyle(s as CSSResultOrNative));
      }
    } else if (styles !== undefined) {
      elementStyles.push(getCompatibleStyle(styles));
    }
    return elementStyles;
  }

  protected static finalize() {
    const wasFinalized = super.finalize();
    if (wasFinalized) {
      this._elementStyles = this.finalizeStyles(this.styles);
    }
    return wasFinalized;
  }

  /**
   * Node or ShadowRoot into which element DOM should be rendered. Defaults
   * to an open shadowRoot.
   */
  readonly renderRoot!: HTMLElement | DocumentFragment;

  /**
   * Node before which to render content. This is used when shimming
   * `adoptedStyleSheets` and a style element may need to exist in the
   * shadowRoot after Lit rendered content.
   */
  private _renderBeforeNode?: HTMLElement;

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
    this.adoptStyles((this.constructor as typeof LitElement)._elementStyles!);
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
  protected adoptStyles(styles: CSSResultFlatArray) {
    // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
    // element's getRootNode(). While this could be done, we're choosing not to
    // support this now since it would require different logic around de-duping.
    if (!(this.renderRoot instanceof window.ShadowRoot)) {
      return;
    }
    if (supportsAdoptingStyleSheets) {
      (this.renderRoot as ShadowRoot).adoptedStyleSheets = styles.map((s) =>
        s instanceof CSSStyleSheet ? s : s.styleSheet!
      );
    } else {
      styles.forEach((s) => {
        const style = document.createElement('style');
        style.textContent = (s as CSSResult).cssText;
        this.renderRoot.appendChild(style);
        this._renderBeforeNode ??= style;
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
        {eventContext: this, renderBefore: this._renderBeforeNode}
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
