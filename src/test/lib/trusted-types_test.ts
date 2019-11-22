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

const unsafeHTMLString = '<img src=x onerror="alert(0)">';
const unsafeScriptString = 'alert(0)';

// Trusted types emulation does not work in IE11 or Chrome 41.
const isIE = /Trident\/\d/.test(navigator.userAgent);
const isChrome41 = /Chrome\/41/.test(navigator.userAgent);

// TODO: replace trusted types emulation with trusted types polyfill,
//   then re-enable these tests in IE and old Chrome.
if (!(isIE || isChrome41)) {
  suite('rendering with trusted types enforced', () => {
    let container: HTMLDivElement;
    // tslint:disable-next-line
    let descriptorEntries: {object: any, prop: any, desc: PropertyDescriptor}[] =
        [];
    let setAttributeDescriptor: PropertyDescriptor;
    let policy: TrustedTypePolicy;

    function emulateSetAttribute() {
      // enforce trusted values only on properties in this array
      const unsafeAttributeList = ['srcdoc'];
      setAttributeDescriptor =
          Object.getOwnPropertyDescriptor(Element.prototype, 'setAttribute')!;
      Object.defineProperty(Element.prototype, 'setAttribute', {
        value: function(name: string, value: string) {
          let args = [name, value];
          unsafeAttributeList.forEach((attr) => {
            if (attr === name) {
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
          Element.prototype, 'setAttribute', setAttributeDescriptor);
    }

    suiteSetup(() => {
      // tslint:disable-next-line
      (window as any).trustedTypes = {
        isHTML: (v: string) => isTrustedValue(v),
        createPolicy: () => {
          return {
            createHTML: createTrustedValue,
            createScript: createTrustedValue,
            createScriptURL: createTrustedValue,
          };
        },
        isScript: (v: string) => isTrustedValue(v),
        isScriptURL: (v: string) => isTrustedValue(v),
      };

      emulateTrustedTypesOnProperty(Element.prototype, 'innerHTML');
      emulateSetAttribute();

      // create app root in the DOM
      container = document.createElement('div');
      document.body.appendChild(container);

      // TODO: signature will change once we use trusted types polyfill
      // tslint:disable-next-line
      policy = (window as any).trustedTypes.createPolicy()
    });

    suiteTeardown(() => {
      removeAllTrustedTypesEmulation();
      // tslint:disable-next-line
      delete (window as any).trustedTypes;
      document.body.removeChild(container);
    });

    test('Trusted types emulation works', () => {
      const el = document.createElement('div');
      assert.equal(el.innerHTML, '');
      el.innerHTML = policy.createHTML('<span>val</span>') as unknown as string;
      assert.equal(el.innerHTML, '<span>val</span>');

      assert.throws(() => {
        el.innerHTML = unsafeHTMLString;
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
        const template = html`<iframe srcdoc=${unsafeScriptString}></iframe>`;
        assert.throws(() => {
          render(template, container);
        });
      });
    });

    suite('runs without error on trusted values', () => {
      test('unsafe html', () => {
        const template =
            html`${unsafeHTML(policy.createHTML('<b>safe bold</b>'))}`;
        render(template, container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<b>safe bold</b>');
      });

      test('unsafe attribute', () => {
        const template =
            html`<iframe srcdoc=${policy.createHTML('<b>safe bold</b>')}>`;
        render(template, container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<iframe srcdoc="<b>safe bold</b>"></iframe>');
      });
    });
  });
}

if (isIE || isChrome41) {
  suite('a suite that makes IE and Chrome41 not time out', () => {
    test('has a test', () => {
      assert.equal(1 + 1, 2);
    });
  });
}
