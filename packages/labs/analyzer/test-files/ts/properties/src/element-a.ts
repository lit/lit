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

@customElement('element-a')
export class ElementA extends LitElement {
  static properties = {
    staticProp: {attribute: 'static-prop', type: Number},
  };

  declare staticProp: number;

  constructor() {
    super();
    this.staticProp = 42;
  }

  notDecorated: string;

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

  overloaded(x: string): string;
  overloaded(x: number): number;
  /**
   * This function has an overloaded signature in TS.
   * @param x Some value, either a string or a number.
   * @returns Returns either a string or a number.
   */
  overloaded(x: string | number): string | number {
    if (typeof x === 'string') {
      return x + 'abc';
    } else {
      return x + 123;
    }
  }

  /**
   * This is not the implementation signature, but there are no docs on the
   * implementation signature.
   * @param x This might be a string or a number, even though this signature
   * only allows strings.
   * @returns Returns either a string or a number, but this signature only
   * mentions `string`.
   */
  overloadedWithDocsOnOverloadOnly(x: string): string;
  overloadedWithDocsOnOverloadOnly(x: number): number;
  overloadedWithDocsOnOverloadOnly(x: string | number): string | number {
    if (typeof x === 'string') {
      return x + 'abc';
    } else {
      return x + 123;
    }
  }

  /**
   * This is not the implementation signature.
   * @param x This is definitely a string.
   * @returns Returns a string for sure.
   */
  overloadedWithDocsOnMany(x: string): string;
  /**
   * This is not the implementation signature either.
   * @param x This is a number, whether you like it or not.
   * @returns Also a number.
   */
  overloadedWithDocsOnMany(x: number): number;
  /**
   * This is the implementation signature.
   * @param x Maybe a string, maybe a number.
   * @returns Returns either a string or a number, depending on the mood.
   */
  overloadedWithDocsOnMany(x: string | number): string | number {
    if (typeof x === 'string') {
      return x + 'abc';
    } else {
      return x + 123;
    }
  }
}
