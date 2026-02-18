/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  customElement,
  define,
  warn,
  warnPackageVersion,
} from '@lit/reactive-element/decorators/custom-element.js';
import {generateElementName} from '../test-helpers.js';
import {assert} from 'chai';

suite('@customElement', () => {
  test('defines an element', () => {
    const tagName = generateElementName();
    @customElement(tagName)
    class C0 extends HTMLElement {}
    const DefinedC = customElements.get(tagName);
    assert.strictEqual(DefinedC, C0);
  });
  test('elements with private constructors can be defined', () => {
    const tagName = generateElementName();
    @customElement(tagName)
    class C1 extends HTMLElement {
      private constructor() {
        super();
      }
    }
    const DefinedC = customElements.get(tagName);
    assert.strictEqual(DefinedC, C1 as typeof DefinedC);
  });
  test('calls error callback on exception', () => {
    const tagName = generateElementName();
    let errorCount = 0,
      errorTagName = '',
      errorCtor: CustomElementConstructor | null = null;
    const errorCallback = (
      _error: Error,
      tagName: string,
      ctor: CustomElementConstructor
    ) => {
      errorCount++;
      errorTagName = tagName;
      errorCtor = ctor;
    };
    @customElement(tagName, errorCallback)
    class C2 extends HTMLElement {}
    assert.equal(C2, customElements.get(tagName));
    assert.equal(errorCount, 0);
    assert.equal(errorTagName, '');
    assert.isNull(errorCtor);
    @customElement(tagName, errorCallback)
    class C3 extends HTMLElement {}
    assert.equal(errorCount, 1);
    assert.equal(errorTagName, tagName);
    assert.equal(errorCtor, C3);
  });
});

suite('define', () => {
  const warnDesc = Object.getOwnPropertyDescriptor(console, 'warn')!;
  let warning = '';
  setup(() => {
    warning = '';
    Object.defineProperty(console, 'warn', {
      value: (message: string) => (warning = message),
      configurable: true,
      enumerable: true,
    });
  });
  teardown(() => {
    Object.defineProperty(console, 'warn', warnDesc);
  });
  test('defines an element', () => {
    const tagName = generateElementName();
    class C0 extends HTMLElement {}
    define(tagName, C0);
    const DefinedC = customElements.get(tagName);
    assert.strictEqual(DefinedC, C0);
  });

  test('calls error callback on exception', () => {
    const tagName = generateElementName();
    let errorCount = 0,
      errorTagName = '',
      errorCtor: CustomElementConstructor | null = null;
    const errorCallback = (
      _error: Error,
      tagName: string,
      ctor: CustomElementConstructor
    ) => {
      errorCount++;
      errorTagName = tagName;
      errorCtor = ctor;
    };
    class C1 extends HTMLElement {}
    define(tagName, C1, errorCallback);
    assert.equal(errorCount, 0);
    assert.equal(errorTagName, '');
    assert.isNull(errorCtor);
    class C2 extends HTMLElement {}
    define(tagName, C2, errorCallback);
    assert.equal(errorCount, 1);
    assert.equal(errorTagName, tagName);
    assert.equal(errorCtor, C2);
  });
  test('`warn` warns on exception', () => {
    const tagName = generateElementName();
    class C3 extends HTMLElement {}
    define(tagName, C3);
    class C4 extends HTMLElement {}
    define(tagName, C4, warn);
    assert.notEqual(warning, '');
  });
  test('`warnPackageVersion` warns on incompatible package/version', () => {
    let tagName = generateElementName();
    // defined with no package/version
    class C5 extends HTMLElement {}
    define(tagName, C5);
    class C6 extends HTMLElement {}
    define(tagName, C6, warnPackageVersion);
    assert.equal(warning, '', 'no package/version should not warn');
    warning = '';
    // defined with package and no version
    tagName = generateElementName();
    class C7 extends HTMLElement {
      static package = 'foo';
    }
    define(tagName, C7, warnPackageVersion);
    class C8 extends HTMLElement {
      static package = 'foo';
    }
    define(tagName, C8, warnPackageVersion);
    assert.equal(warning, '', 'same package should not warn');
    class C9 extends HTMLElement {
      static package = 'foo2';
    }
    define(tagName, C9, warnPackageVersion);
    assert.notEqual(warning, '', 'different package should warn');
    warning = '';
    // defined with package and version
    tagName = generateElementName();
    class C10 extends HTMLElement {
      static package = 'bar';
      static version = '1.0.0';
    }
    define(tagName, C10, warnPackageVersion);
    class C11 extends HTMLElement {
      static package = 'bar';
      static version = '1.0.0';
    }
    define(tagName, C11, warnPackageVersion);
    assert.equal(warning, '', 'same package and version should not warn');
    class C12 extends HTMLElement {
      static package = 'bar';
      static version = '1.0.1';
    }
    define(tagName, C12, warnPackageVersion);
    assert.equal(warning, '', 'different patch version should not warn');
    class C13 extends HTMLElement {
      static package = 'bar';
      static version = '1.1.0';
    }
    define(tagName, C13, warnPackageVersion);
    assert.notEqual(warning, '', 'different minor version should warn');
    warning = '';
    class C14 extends HTMLElement {
      static package = 'bar';
      static version = '2.0.0';
    }
    define(tagName, C14, warnPackageVersion);
    assert.notEqual(warning, '', 'different major version should warn');
  });
});
