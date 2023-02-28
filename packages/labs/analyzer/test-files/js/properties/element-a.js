/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {LitElement} from 'lit';
import {ImportedClass} from './external.js';

export class LocalClass {
  constructor() {
    this.someData = 42;
  }
}

export class ElementA extends LitElement {
  static properties = {
    noOptionsString: {},
    noOptionsNumber: {},
    typeString: {type: String},
    typeNumber: {type: Number},
    typeBoolean: {type: Boolean},
    reflectTrue: {reflect: true},
    reflectFalse: {reflect: false},
    reflectUndefined: {reflect: undefined},
    attributeTrue: {attribute: true},
    attributeFalse: {attribute: false},
    attributeUndefined: {attribute: undefined},
    attributeString: {attribute: 'abc'},
    customConverter: {converter: {fromAttribute() {}, toAttribute() {}}},
    localClass: {},
    importedClass: {},
    globalClass: {},
    union: {},
    staticProp: {attribute: 'static-prop', type: Number},
  };

  constructor() {
    super();
    this.notDecorated = '';
    this.noOptionsString = '';
    this.noOptionsNumber = 42;
    this.typeString = '';
    this.typeNumber = 42;
    this.typeBoolean = true;
    this.reflectTrue = '';
    this.reflectFalse = '';
    this.reflectUndefined = '';
    this.attributeTrue = '';
    this.attributeFalse = '';
    this.attributeUndefined = '';
    this.attributeString = '';
    this.customConverter = '';
    this.localClass = new LocalClass();
    this.importedClass = new ImportedClass();
    this.globalClass = document.createElement('foo');
    this.staticProp = 42;
  }

  /**
   * This function has an overloaded signature in TS.
   * @param {string | number} x Some value, either a string or a number.
   * @returns {string | number} Returns either a string or a number.
   */
  overloaded(x) {
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
  overloadedWithDocsOnOverloadOnly(x) {
    if (typeof x === 'string') {
      return x + 'abc';
    } else {
      return x + 123;
    }
  }

  /**
   * This is the implementation signature.
   * @param x Maybe a string, maybe a number.
   * @returns Returns either a string or a number, depending on the mood.
   */
  overloadedWithDocsOnMany(x) {
    if (typeof x === 'string') {
      return x + 'abc';
    } else {
      return x + 123;
    }
  }
}
customElements.define('element-a', ElementA);
