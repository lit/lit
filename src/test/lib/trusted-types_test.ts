/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
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

import {unsafeHTML} from '../../directives/unsafe-html';
import {html, render} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers';

const assert = chai.assert;

const createTrustedValue = (value: string) => `TRUSTED${value}`;
const isTrustedValue = (value: string) => value.startsWith('TRUSTED');
const unwrapTrustedValue = (value: string) => value.substr('TRUSTED'.length);

// TODO: replace trusted types emulation with trusted types polyfill
suite('rendering with trusted types enforced', () => {
  let container: HTMLDivElement;
  // tslint:disable-next-line
  let descriptorEntries: {object: any, prop: any, desc: PropertyDescriptor}[] =
      [];
  let setAttributeDescriptor: PropertyDescriptor;

  function emulateSetAttributeOnProperties() {
    // this is a bit cheaty as
    // 1) we emulate on properties
    // 2) only on those use trusted types (e.g. emulateTrustedTypesOnProperty
    // was called on them)
    setAttributeDescriptor =
        Object.getOwnPropertyDescriptor(Element.prototype, 'setAttribute')!;
    Object.defineProperty(Element.prototype, 'setAttribute', {
      value: function(name: string, value: string) {
        let args = [name, value];
        descriptorEntries.forEach(({prop}) => {
          if (prop === name) {
            if (isTrustedValue(value)) {
              args = [name, unwrapTrustedValue(value)];
            } else {
              throw new Error(value);
            }
          }
        });
        setAttributeDescriptor.value.apply(this, args);
      }
    });
  }

  function emulateTrustedTypesOnProperty<Obj, K extends keyof Obj>(
      object: Obj, prop: K) {
    const desc = Object.getOwnPropertyDescriptor(object, prop)!;
    descriptorEntries.push({object, prop, desc});
    Object.defineProperty(object, prop, {
      set: function(value: string) {
        if (isTrustedValue(value)) {
          desc.set!.apply(this, [unwrapTrustedValue(value)]);
        } else {
          throw new Error(value);
        }
      },
    });
  }

  function removeAllTrustedTypesEmulation() {
    descriptorEntries.forEach(({object, prop, desc}) => {
      Object.defineProperty(object, prop, desc);
    });
    descriptorEntries = [];

    Object.defineProperty(
        Element.prototype, 'setAttribute', setAttributeDescriptor!);
  }

  suiteSetup(() => {
    // tslint:disable-next-line
    (window as any).TrustedTypes = {
      isHTML: () => true,
      createPolicy: () => {
        return {createHTML: createTrustedValue};
      },
      isScript: () => false,
      isScriptURL: () => false,
      isURL: () => false,
    };

    emulateTrustedTypesOnProperty(Element.prototype, 'innerHTML');
    emulateTrustedTypesOnProperty(HTMLIFrameElement.prototype, 'srcdoc');
    emulateSetAttributeOnProperties();

    // create app root in the DOM
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  suiteTeardown(() => {
    removeAllTrustedTypesEmulation();
  });

  test('Trusted types emulation works', () => {
    const el = document.createElement('div');
    assert.equal(el.innerHTML, '');
    el.innerHTML = createTrustedValue('<span>val</span>');
    assert.equal(el.innerHTML, '<span>val</span>');

    assert.throws(() => {
      el.innerHTML = '<span>val</span>';
    });
  });

  suite('throws on untrusted values', () => {
    test('unsafe html', () => {
      const template = html`${unsafeHTML('<b>unsafe bold</b>')}`;
      assert.throws(() => {
        render(template, container);
      });
    });

    test('unsafe attribute', () => {
      const template = html`<iframe srcdoc=${'www.evil_url.com'}></iframe>`;
      assert.throws(() => {
        render(template, container);
      });
    });
  });

  suite('runs without error on trusted values', () => {
    test('unsafe html', () => {
      const template =
          html`${unsafeHTML(createTrustedValue('<b>unsafe bold</b>'))}`;
      render(template, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<b>unsafe bold</b>');
    });

    test('unsafe attribute', () => {
      const template =
          html`<iframe srcdoc=${createTrustedValue('www.evil_url.com')}>`;
      render(template, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<iframe srcdoc="www.evil_url.com"></iframe>');
    });
  });
});
