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

const unsupportedPropertyName = Symbol();

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

  [unsupportedPropertyName] = '';

  /** @type {number} */
  get getterOnly() {
    return 0;
  }

  /** @type {number} */
  get accessorPair() {
    return 0;
  }
  set accessorPair(_) {
    void 0;
  }

  /** @readonly */
  readonlyField = 0;

  constructor() {
    super();
    this.constructorAssignOnly = 0;
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
   * This signature works with strings or numbers.
   * @param {string | number} x Accepts either a string or a number.
   * @returns {string | number} Returns either a string or a number.
   */
  overloaded(x) {
    if (typeof x === 'string') {
      return x + 'abc';
    } else {
      return x + 123;
    }
  }
}
customElements.define('element-a', ElementA);
