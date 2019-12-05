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

import {Template} from '../../lib/template.js';
import {html, TemplateResult} from '../../lit-html.js';

const assert = chai.assert;

suite('Template', () => {
  test('does not create extra empty text nodes', () => {
    const countNodes =
        (result: TemplateResult,
         getNodes: (f: DocumentFragment) => NodeList) => {
          const template = new Template(result, result.getTemplateElement());
          return getNodes(template.element.content).length;
        };

    assert.equal(
        countNodes(html`<div>${0}</div>`, (c) => c.childNodes[0].childNodes),
        2);
    assert.equal(countNodes(html`${0}`, (c) => c.childNodes), 2);
    assert.equal(countNodes(html`a${0}`, (c) => c.childNodes), 2);
    assert.equal(countNodes(html`${0}a`, (c) => c.childNodes), 2);
    assert.equal(countNodes(html`${0}${0}`, (c) => c.childNodes), 3);
    assert.equal(countNodes(html`a${0}${0}`, (c) => c.childNodes), 3);
    assert.equal(countNodes(html`${0}b${0}`, (c) => c.childNodes), 3);
    assert.equal(countNodes(html`${0}${0}c`, (c) => c.childNodes), 3);
    assert.equal(countNodes(html`a${0}b${0}c`, (c) => c.childNodes), 3);
  });

  test('parses parts for multiple expressions', () => {
    const result = html`
      <div a="${1}">
        <p>${2}</p>
        ${3}
        <span a="${4}">${5}</span>
      </div>`;
    const parts = new Template(result, result.getTemplateElement()).parts;
    assert.equal(parts.length, 5);
  });

  test('stores raw names of attributes', () => {
    const result = html`
      <div
        someProp="${1}"
        a-nother="${2}"
        multiParts='${3} ${4}'
        👍=${5}
        (a)=${6}
        [a]=${7}
        a$=${8}>
        <p>${9}</p>
        <div aThing="${10}"></div>
      </div>`;
    const template = new Template(result, result.getTemplateElement());
    const parts = template.parts as Array<{name: string}>;
    const names = parts.map((p) => p.name);
    const expectedAttributeNames = [
      'someProp',
      'a-nother',
      'multiParts',
      '👍',
      '(a)',
      '[a]',
      'a$',
      undefined,
      'aThing'
    ];
    assert.deepEqual(names, expectedAttributeNames);
  });
});
