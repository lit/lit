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

import {removeStylesFromTemplate} from '../../lib/modify-template.js';
import {render} from '../../lib/render.js';
import {html, templateFactory} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

/* eslint-disable @typescript-eslint/no-explicit-any */

suite('removing nodes from template', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('removing style with attribute bindings renders/updates result', () => {
    const getResult = (a: any, b: any, c: any) => html
    `<style bound="${a}"></style><div foo="${b}">${c}</div>`;

    const result = getResult('a', 'b', 'c');
    const template = templateFactory(result);
    removeStylesFromTemplate(template);

    render(result, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), `<div foo="b">c</div>`);

    render(getResult('d', 'e', 'f'), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), `<div foo="e">f</div>`);
  });

  test('removing style with text bindings renders/updates result', () => {
    const getResult = (a: any, b: any, c: any) => html
    `<style>${a}</style><div foo="${b}">${c}</div>`;

    const result = getResult('a', 'b', 'c');
    const template = templateFactory(result);
    removeStylesFromTemplate(template);

    render(result, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), `<div foo="b">c</div>`);

    render(getResult('d', 'e', 'f'), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML), `<div foo="e">f</div>`);
  });
});
