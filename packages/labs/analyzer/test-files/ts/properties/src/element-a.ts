/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ImportedClass} from './external.js';

export class LocalClass {
  someData: number;
}
export interface LocalInterface {
  someData: number;
}

const unsupportedPropertyName = Symbol();

@customElement('element-a')
export class ElementA extends LitElement {
  static properties = {
    staticProp: {attribute: 'static-prop', type: Number},
  };

  declare staticProp: number;

  declare constructorAssignOnly: number;

  constructor() {
    super();
    this.staticProp = 42;
    this.constructorAssignOnly = 0;
  }

  notDecorated: string;

  readonly readonlyField = 0;

  get getterOnly(): number {
    return 0;
  }

  get accessorPair(): number {
    return 0;
  }
  set accessorPair(_: number) {
    void 0;
  }

  @property()
  noOptionsString: string;

  @property()
  noOptionsNumber: number;

  @property({type: String})
  typeString: string;

  @property({type: Number})
  typeNumber: number;

  @property({type: Boolean})
  typeBoolean: boolean;

  @property({reflect: true})
  reflectTrue: string;

  @property({reflect: false})
  reflectFalse: string;

  @property({reflect: undefined})
  reflectUndefined: string;

  @property({attribute: true})
  attributeTrue: string;

  @property({attribute: false})
  attributeFalse: string;

  @property({attribute: undefined})
  attributeUndefined: string;

  @property({attribute: 'abc'})
  attributeString: string;

  @property({converter: {fromAttribute() {}, toAttribute() {}}})
  customConverter: string;

  @property()
  localClass: LocalClass;

  @property()
  importedClass: ImportedClass;

  @property()
  globalClass: HTMLElement;

  @property()
  union: LocalClass | HTMLElement | ImportedClass;

  /**
   * This signature only works with strings.
   * @param x Accepts a string.
   * @returns Returns a string.
   */
  overloaded(x: string): string;
  /**
   * This signature only works with numbers.
   * @param x Accepts a number.
   * @returns Returns a number.
   */
  overloaded(x: number): number;
  /**
   * This signature works with strings or numbers.
   * @param x Accepts either a string or a number.
   * @returns Returns either a string or a number.
   */
  overloaded(x: string | number): string | number {
    if (typeof x === 'string') {
      return x + 'abc';
    } else {
      return x + 123;
    }
  }

  @property()
  [unsupportedPropertyName]: string;
}
