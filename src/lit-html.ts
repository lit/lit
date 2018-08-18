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

import {AttributeCommitter, AttributePart, isDirective, noChange, Part} from './index.js';
import {TemplateProcessor} from './lib/template-processor.js';
import {SVGTemplateResult, TemplateResult} from './lib/template-result.js';

export * from './index.js';

/**
 * Interprets a template literal as a lit-html HTML template.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    new TemplateResult(strings, values, 'html', templateProcessor);

/**
 * Interprets a template literal as a lit-html SVG template.
 */
export const svg = (strings: TemplateStringsArray, ...values: any[]) =>
    new SVGTemplateResult(strings, values, 'svg', templateProcessor);

/**
 * A PartCallback which allows templates to set properties, declarative
 * event handlers, and boolean attributes.
 *
 * Properties are set by prefixing an attribute name with `.`.
 *
 * Attribute names in lit-html templates preserve case, so properties are case
 * sensitive. If an expression takes up an entire attribute value, then the
 * property is set to that value. If an expression is interpolated with a string
 * or other expressions then the property is set to the string result of the
 * interpolation.
 *
 * Example:
 *
 *     html`<input .value=${value}>`
 *
 * Event handlers are set by prefixing an attribute name with `@`.
 *
 * Example:
 *
 *     html`<button @click=${(e)=> this.onClickHandler(e)}>Buy Now</button>`
 *
 * Boolean attributes are set by prepending `?` to an attribute name.
 *
 * Example:
 *
 *     html`<input type="checkbox" ?checked=${value}>`
 */

export class LitTemplateProcessor extends TemplateProcessor {
  handleAttributeExpressions(element: Element, name: string, strings: string[]):
      Part[] {
    const prefix = name[0];
    if (prefix === '.') {
      const comitter = new PropertyCommitter(element, name.slice(1), strings);
      return comitter.parts;
    }
    if (prefix === '@') {
      return [new EventPart(element, name.slice(1))];
    }
    if (prefix === '?') {
      return [new BooleanAttributePart(element, name.slice(1), strings)];
    }
    return super.handleAttributeExpressions(element, name, strings);
  }
}
export const templateProcessor = new LitTemplateProcessor();

/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
export class BooleanAttributePart implements Part {
  element: Element;
  name: string;
  strings: string[];
  value: any = undefined;
  _pendingValue: any = undefined;

  constructor(element: Element, name: string, strings: string[]) {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error(
          'Boolean attributes can only contain a single expression');
    }
    this.element = element;
    this.name = name;
    this.strings = strings;
  }

  setValue(value: any): void {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }
    if (this._pendingValue === noChange) {
      return;
    }
    const value = !!this._pendingValue;
    if (this.value !== value) {
      if (value) {
        this.element.setAttribute(this.name, '');
      } else {
        this.element.removeAttribute(this.name);
      }
    }
    this.value = value;
    this._pendingValue = noChange;
  }
}

/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
export class PropertyCommitter extends AttributeCommitter {
  single: boolean;

  constructor(element: Element, name: string, strings: string[]) {
    super(element, name, strings);
    this.single =
        (strings.length === 2 && strings[0] === '' && strings[1] === '');
  }

  protected _createPart(): PropertyPart {
    return new PropertyPart(this);
  }

  _getValue() {
    if (this.single) {
      return this.parts[0].value;
    }
    return super._getValue();
  }

  commit(): void {
    if (this.dirty) {
      this.dirty = false;
      (this.element as any)[this.name] = this._getValue();
    }
  }
}

export class PropertyPart extends AttributePart {}

export class EventPart implements Part {
  element: Element;
  eventName: string;
  value: any = undefined;
  _pendingValue: any = undefined;

  constructor(element: Element, eventName: string) {
    this.element = element;
    this.eventName = eventName;
  }

  setValue(value: any): void {
    this._pendingValue = value;
  }

  commit() {
    while (isDirective(this._pendingValue)) {
      const directive = this._pendingValue;
      this._pendingValue = noChange;
      directive(this);
    }
    if (this._pendingValue === noChange) {
      return;
    }
    if ((this._pendingValue == null) !== (this.value == null)) {
      if (this._pendingValue == null) {
        this.element.removeEventListener(this.eventName, this);
      } else {
        this.element.addEventListener(this.eventName, this);
      }
    }
    this.value = this._pendingValue;
    this._pendingValue = noChange;
  }

  handleEvent(event: Event) {
    if (typeof this.value === 'function') {
      this.value.call(this.element, event);
    } else if (typeof this.value.handleEvent === 'function') {
      this.value.handleEvent(event);
    }
  }
}
