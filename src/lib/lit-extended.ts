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

import {AttributeCommitter, Part, SVGTemplateResult, TemplateProcessor, TemplateResult} from '../core.js';
import {BooleanAttributePart, EventPart, PropertyCommitter} from '../lit-html.js';

export {render} from '../core.js';
export {BooleanAttributePart, EventPart} from '../lit-html.js';

/**
 * Interprets a template literal as a lit-extended HTML template.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    new TemplateResult(strings, values, 'html', templateProcessor);

/**
 * Interprets a template literal as a lit-extended SVG template.
 */
export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
    new SVGTemplateResult(strings, values, 'svg', templateProcessor);

/**
 * A PartCallback which allows templates to set properties and declarative
 * event handlers.
 *
 * Properties are set by default, instead of attributes. Attribute names in
 * lit-html templates preserve case, so properties are case sensitive. If an
 * expression takes up an entire attribute value, then the property is set to
 * that value. If an expression is interpolated with a string or other
 * expressions then the property is set to the string result of the
 * interpolation.
 *
 * To set an attribute instead of a property, append a `$` suffix to the
 * attribute name.
 *
 * Example:
 *
 *     html`<button class$="primary">Buy Now</button>`
 *
 * To set an event handler, prefix the attribute name with `on-`:
 *
 * Example:
 *
 *     html`<button on-click=${(e)=> this.onClickHandler(e)}>Buy Now</button>`
 *
 * @deprecated Please use /lit-html.js instead. lit-extended will be removed in
 *     a future version.
 */
export class LitExtendedTemplateProcessor extends TemplateProcessor {
  handleAttributeExpressions(element: Element, name: string, strings: string[]):
      Part[] {
    if (name.substr(0, 3) === 'on-') {
      const eventName = name.slice(3);
      return [new EventPart(element, eventName)];
    }
    const lastChar = name.substr(name.length - 1);
    if (lastChar === '$') {
      const comitter =
          new AttributeCommitter(element, name.slice(0, -1), strings);
      return comitter.parts;
    }
    if (lastChar === '?') {
      return [new BooleanAttributePart(element, name.slice(0, -1), strings)];
    }
    const comitter = new PropertyCommitter(element, name, strings);
    return comitter.parts;
  }
}
export const templateProcessor = new LitExtendedTemplateProcessor();
