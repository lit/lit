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

import {AttributePart, defaultPartCallback, Part, SVGTemplateResult, TemplateInstance, TemplatePart, TemplateResult} from '../core.js';
import {BooleanAttributePart, EventPart, PropertyPart} from '../lit-html.js';

export {render} from '../core.js';
export {BooleanAttributePart, EventPart, PropertyPart} from '../lit-html.js';

/**
 * Interprets a template literal as a lit-extended HTML template.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    new TemplateResult(strings, values, 'html', extendedPartCallback);

/**
 * Interprets a template literal as a lit-extended SVG template.
 */
export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
    new SVGTemplateResult(strings, values, 'svg', extendedPartCallback);

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
 */
export const extendedPartCallback =
    (instance: TemplateInstance, templatePart: TemplatePart, node: Node):
        Part => {
          if (templatePart.type === 'attribute') {
            if (templatePart.rawName!.substr(0, 3) === 'on-') {
              const eventName = templatePart.rawName!.slice(3);
              return new EventPart(instance, node as Element, eventName);
            }
            const lastChar =
                templatePart.name!.substr(templatePart.name!.length - 1);
            if (lastChar === '$') {
              const name = templatePart.name!.slice(0, -1);
              return new AttributePart(
                  instance, node as Element, name, templatePart.strings!);
            }
            if (lastChar === '?') {
              const name = templatePart.name!.slice(0, -1);
              return new BooleanAttributePart(
                  instance, node as Element, name, templatePart.strings!);
            }
            return new PropertyPart(
                instance,
                node as Element,
                templatePart.rawName!,
                templatePart.strings!);
          }
          return defaultPartCallback(instance, templatePart, node);
        };
