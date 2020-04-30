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


const unsafeScriptString = 'alert(0)';

function trustedTypesIsEnforced() {
  const div = document.createElement('div');
  try {
    div.innerHTML = '<img src="#">';
  } catch {
    return true;
  }
  return false;
}

if (window.trustedTypes !== undefined) {
  const policy: TrustedTypePolicy =
      window.trustedTypes.createPolicy('lit-html-test', {
        createHTML(input) {
          return input;
        },
        createScript(input) {
          return input;
        },
        createScriptURL(input) {
          return input;
        },
        createURL(input) {
          return input;
        },
      });
  suite('rendering with trusted type values', () => {
    let container: HTMLDivElement;
    suiteSetup(() => {
      // create app root in the DOM
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    suiteTeardown(() => {
      document.body.removeChild(container);
    });

    test('trusted types works with native APIs', () => {
      const el = document.createElement('div');
      assert.equal(el.innerHTML, '');
      el.innerHTML = policy.createHTML('<span>val</span>') as unknown as string;
      assert.equal(el.innerHTML, '<span>val</span>');
    });

    if (trustedTypesIsEnforced()) {
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
    }

    suite('runs without error on trusted values', () => {
      test('unsafeHTML() with blessed input', () => {
        const template =
            html`${unsafeHTML(policy.createHTML('<b>safe bold</b>'))}`;
        render(template, container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML), '<b>safe bold</b>');
      });

      test('blessed input on unsafe attribute', () => {
        const safeHtml =
            policy.createHTML('<b>safe bold</b>') as unknown as string;
        const template = html`<iframe srcdoc=${safeHtml}>`;
        render(template, container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<iframe srcdoc="<b>safe bold</b>"></iframe>');
      });

      test('blessed input on unsafe property', () => {
        const safeHtml =
            policy.createHTML('<b>safe bold</b>') as unknown as string;
        const template = html`<iframe .srcdoc=${safeHtml}>`;
        render(template, container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            '<iframe srcdoc="<b>safe bold</b>"></iframe>');
      });
    });
  });
} else {
  it('trusted types not present in this browser', () => null);
}
