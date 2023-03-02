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
}
customElements.define('element-a', ElementA);
