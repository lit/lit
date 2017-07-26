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

/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/chai/index.d.ts" />

import {html} from '../../lit-html.js';
import {renderExtendedTo} from '../../labs/lit-extended.js';

const assert = chai.assert;

suite('lit-extended', () => {
  suite('renderExtendedTo', () => {
    test('reuses an existing ExtendedTemplateInstance when available', () => {
        const container = document.createElement('div');

        const t = (content: any) => html`<div>${content}</div>`;

        renderExtendedTo(t('foo'), container);

        assert.equal(container.children.length, 1);
        const fooDiv = container.children[0];
        assert.equal(fooDiv.textContent, 'foo');

        renderExtendedTo(t('bar'), container);

        assert.equal(container.children.length, 1);
        const barDiv = container.children[0];
        assert.equal(barDiv.textContent, 'bar');

        assert.equal(fooDiv, barDiv);
    });

    test('overwrites an existing (plain) TemplateInstance if one exists, ' +
      'even if it has a matching Template', () => {
        const container = document.createElement('div');

        const t = () => html`<div>foo</div>`;

        t().renderTo(container);

        assert.equal(container.children.length, 1);
        const firstDiv = container.children[0];
        assert.equal(firstDiv.textContent, 'foo');

        renderExtendedTo(t(), container);

        assert.equal(container.children.length, 1);
        const secondDiv = container.children[0];
        assert.equal(secondDiv.textContent, 'foo');

        assert.notEqual(firstDiv, secondDiv);
      });

    test('overwrites an existing ExtendedTemplateInstance if one exists and ' +
      'does not have a matching Template', () => {
        const container = document.createElement('div');

        renderExtendedTo(html`<div>foo</div>`, container);

        assert.equal(container.children.length, 1);
        const fooDiv = container.children[0];
        assert.equal(fooDiv.textContent, 'foo');

        renderExtendedTo(html`<div>bar</div>`, container);

        assert.equal(container.children.length, 1);
        const barDiv = container.children[0];
        assert.equal(barDiv.textContent, 'bar');

        assert.notEqual(fooDiv, barDiv);
      });
  });
});


