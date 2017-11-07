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

import {getValue} from './lit-html.js';
import {MultiPart} from './part.js';
import {TemplateInstance} from './template-instance.js';

export class AttributePart implements MultiPart {
  instance: TemplateInstance;
  element: Element;
  name: string;
  strings: string[];
  size: number;

  constructor(
      instance: TemplateInstance, element: Element, name: string,
      strings: string[]) {
    this.instance = instance;
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.size = strings.length - 1;
  }

  protected _interpolate(values: any[], startIndex: number) {
    const strings = this.strings;
    const l = strings.length - 1;
    let text = '';

    for (let i = 0; i < l; i++) {
      text += strings[i];
      const v = getValue(this, values[startIndex + i]);
      if (v &&
          (Array.isArray(v) || typeof v !== 'string' && v[Symbol.iterator])) {
        for (const t of v) {
          // TODO: we need to recursively call getValue into iterables...
          text += t;
        }
      } else {
        text += v;
      }
    }
    return text + strings[l];
  }

  setValue(values: any[], startIndex: number): void {
    const text = this._interpolate(values, startIndex);
    this.element.setAttribute(this.name, text);
  }
}
