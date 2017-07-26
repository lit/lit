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

import { TemplateResult, AttributePart, TemplateInstance, TemplatePart, Part, Template } from '../lit-html.js';

/**
 *
 * @param result Renders a `TemplateResult` to a container using an
 * `ExtendedTemplateInstance`, which allows templates to set properties and
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
 * To set an event handler, prefix the attribute name with `on-` and use a
 * function to return the handler, so that the event handler itself is not
 * called as a template directive.
 *
 * Example:
 *
 *     html`<button on-click=${_=> this.onClickHandler}>Buy Now</button>`
 *
 */
export function render(result: TemplateResult, container: Element|DocumentFragment) {
  let instance = container.__templateInstance as any;
  if (instance !== undefined &&
      instance.template === result.template &&
      instance instanceof ExtendedTemplateInstance) {
    instance.update(result.values);
    return;
  }

  instance = new ExtendedTemplateInstance(result.template);
  container.__templateInstance = instance;

  const fragment = instance._clone();
  instance.update(result.values);

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(fragment);
}

export class ExtendedTemplateInstance extends TemplateInstance {

  _createPart(templatePart: TemplatePart, node: Node): Part {
    if (templatePart.type === 'attribute') {
      if (templatePart.rawName!.startsWith('on-')) {
        const eventName = templatePart.rawName!.substring(3);
        return new EventPart(this, node as Element, eventName);
      }
      if (templatePart.name!.endsWith('$')) {
        const name = templatePart.name!.substring(0, templatePart.name!.length - 1);
        return new AttributePart(this, node as Element, name, templatePart.strings!);
      }
      return new PropertyPart(this, node as Element, templatePart.rawName!, templatePart.strings!);
    }
    return super._createPart(templatePart, node);
  }

  _createInstance(template: Template) {
    return new ExtendedTemplateInstance(template);
  }
}

export class PropertyPart extends AttributePart {

  setValue(values: any[]): void {
    const s = this.strings;
    let value: any;
    if (s.length === 2 && s[0] === '' && s[s.length - 1] === '') {
      // An expression that occupies the whole attribute value will leave
      // leading and trailing empty strings.
      value = this._getValue(values[0]);
    } else {
      // Interpolation, so interpolate
      value = '';
      for (let i = 0; i < s.length; i++) {
        value += s[i];
        if (i < s.length - 1) {
          value += this._getValue(values[i]);
        }
      }
    }
    (this.element as any)[this.name] = value;
  }
}

export class EventPart extends Part {

  element: Element;
  eventName: string;
  private _listener: any;

  constructor(instance: TemplateInstance, element: Element, eventName: string) {
    super(instance);
    this.element = element;
    this.eventName = eventName;
  }

  setValue(value: any): void {
    const listener = this._getValue(value);
    if (typeof listener !== 'function') {
      console.error('event handlers must be functions', listener);
      return;
    }
    if (listener === this._listener) {
      return;
    }
    if (listener === undefined) {
      this.element.removeEventListener(this.eventName, this);
    }
    if (this._listener === undefined) {
      this.element.addEventListener(this.eventName, this);
    }
    this._listener = listener;
  }

  handleEvent(event: Event) {
    this._listener.call(this.element, event);
  }
}
