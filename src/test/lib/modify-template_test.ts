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

import {insertNodeIntoTemplate, removeNodesFromTemplate} from '../../lib/modify-template.js';
import {render} from '../../lib/render.js';
import {html, templateFactory} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers.js';

const assert = chai.assert;

// tslint:disable:no-any OK in test code.

suite('add/remove nodes from template', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
  });

  test(
      'inserting nodes into template between parts renders/updates result',
      () => {
        const getResult = (a: any, b: any, c: any) => html`
        <div foo="${a}">
          ${b}
          <p>${c}</p>
        </div>`;
        const result = getResult('bar', 'baz', 'qux');
        const template = templateFactory(result);
        const div1 = document.createElement('div');
        div1.innerHTML = '<span>1</span>';
        insertNodeIntoTemplate(
            template, div1, template.element.content.firstChild);
        const div2 = document.createElement('div');
        div2.innerHTML = '<span>2</span>';
        insertNodeIntoTemplate(
            template, div2, template.element.content.querySelector('p'));
        const div3 = document.createElement('div');
        div3.innerHTML = '<span>3</span>';
        insertNodeIntoTemplate(template, div3);
        render(result, container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            `<div><span>1</span></div>
        <div foo="bar">
          baz
          <div><span>2</span></div><p>qux</p>
        </div><div><span>3</span></div>`);
        render(getResult('a', 'b', 'c'), container);
        assert.equal(
            stripExpressionMarkers(container.innerHTML),
            `<div><span>1</span></div>
        <div foo="a">
          b
          <div><span>2</span></div><p>c</p>
        </div><div><span>3</span></div>`);
      });

  test('inserting documentFragment into template', () => {
    const getResult = (a: any, b: any, c: any) =>
        html`<div foo="${a}">${b}<p>${c}</p></div>`;
    const result = getResult('bar', 'baz', 'qux');
    const template = templateFactory(result);
    const fragment1 = document.createDocumentFragment();
    fragment1.appendChild(document.createElement('div'));
    (fragment1.firstChild as HTMLElement)!.innerHTML = '<span>1</span>';
    insertNodeIntoTemplate(
        template, fragment1, template.element.content.firstChild);
    const fragment2 = document.createDocumentFragment();
    insertNodeIntoTemplate(
        template, fragment2, template.element.content.querySelector('p'));
    render(result, container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        `<div><span>1</span></div><div foo="bar">baz<p>qux</p></div>`);
    render(getResult('a', 'b', 'c'), container);
    assert.equal(
        stripExpressionMarkers(container.innerHTML),
        `<div><span>1</span></div><div foo="a">b<p>c</p></div>`);
  });

  test(
      'removing nodes in template between parts renders/updates result', () => {
        const getResult = (a: any, b: any, c: any) =>
            html`<div name="remove"><span>remove</span></div>
        <div foo="${a}"><div name="remove"><span>remove</span></div>
          ${b}
          <div name="remove"><span name="remove">remove</span></div><p>${c}</p>
        </div><div name="remove"><span name="remove"><span name="remove">remove</span></span></div>`;
        const result = getResult('bar', 'baz', 'qux');
        const template = templateFactory(result);
        const nodeSet = new Set();
        const nodesToRemove =
            template.element.content.querySelectorAll('[name="remove"]');
        for (const node of Array.from(nodesToRemove)) {
          nodeSet.add(node);
        }
        removeNodesFromTemplate(template, nodeSet);
        render(result, container);
        assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div foo="bar">
          baz
          <p>qux</p>
        </div>`);
        render(getResult('a', 'b', 'c'), container);
        assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div foo="a">
          b
          <p>c</p>
        </div>`);
      });

  test(
      'removing nodes in template containing parts renders/updates result',
      () => {
        const getResult = (a: any, b: any, c: any, r1: any, r2: any, r3: any) =>
            html`<div name="remove"><span>${r1}</span></div>
        <div foo="${a}"><div name="remove"><span>${r2}</span></div>
          ${b}
          <div name="remove"><span name="remove">${r3}</span></div><p>${c}</p>
        </div><div name="remove"><span name="remove"><span name="remove">remove</span></span></div>`;
        const result = getResult('bar', 'baz', 'qux', 'r1', 'r2', 'r3');
        const template = templateFactory(result);
        const nodeSet = new Set();
        const nodesToRemove =
            template.element.content.querySelectorAll('[name="remove"]');
        for (const node of Array.from(nodesToRemove)) {
          nodeSet.add(node);
        }
        removeNodesFromTemplate(template, nodeSet);
        render(result, container);
        assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div foo="bar">
          baz
          <p>qux</p>
        </div>`);
        render(getResult('a', 'b', 'c', 'rr1', 'rr2', 'rr3'), container);
        assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div foo="a">
          b
          <p>c</p>
        </div>`);
      });

  test(
      'removing nodes in template containing parts with in-active parts renders/updates result',
      () => {
        const getResult = (a: any, b: any, c: any, r1: any, r2: any, r3: any) =>
            html`<div name="remove"><span>${r1}</span></div>
        <div foo="${a}"><div name="remove"><span>${r2}</span></div>
          ${b}
          <div name="remove"><span name="remove">${r3}</span></div><p>${c}</p>
        </div><div name="remove"><span name="remove"><span name="remove">remove</span></span></div>`;
        const result = getResult('bar', 'baz', 'qux', 'r1', 'r2', 'r3');
        const template = templateFactory(result);
        let node;
        while (node =
                   template.element.content.querySelector('[name="remove"]')) {
          const nodeSet = new Set();
          nodeSet.add(node);
          removeNodesFromTemplate(template, nodeSet);
        }
        render(result, container);
        assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div foo="bar">
          baz
          <p>qux</p>
        </div>`);
        render(getResult('a', 'b', 'c', 'rr1', 'rr2', 'rr3'), container);
        assert.equal(stripExpressionMarkers(container.innerHTML), `
        <div foo="a">
          b
          <p>c</p>
        </div>`);
      });
});
