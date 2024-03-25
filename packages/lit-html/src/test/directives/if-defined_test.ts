/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ifDefined} from 'lit-html/directives/if-defined.js';
import {html, render} from 'lit-html';
import {stripExpressionMarkers} from '@lit-labs/testing';
import {assert} from '@esm-bundle/chai';

suite('ifDefined directive', () => {
  let container: HTMLDivElement;

  setup(() => {
    container = document.createElement('div');
  });

  test('sets an attribute with a defined value', () => {
    render(html`<div foo="${ifDefined('a')}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div foo="a"></div>'
    );
  });

  test('removes an attribute with an undefined value', () => {
    render(html`<div foo="${ifDefined(undefined)}"></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('sets an attribute with a previously undefined value', () => {
    render(html`<div foo="${ifDefined(undefined)}"></div>`, container);
    render(html`<div foo="${ifDefined('a')}"></div>`, container);
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div foo="a"></div>'
    );
  });

  test('removes an attribute with previously defined value', () => {
    render(html`<div foo="${ifDefined('a')}"></div>`, container);
    render(html`<div foo="${ifDefined(undefined)}"></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('removes an attribute with previous value set outside ifDefined', () => {
    const go = (v: unknown) => render(html`<div foo="${v}"></div>`, container);
    go('a');
    go(ifDefined(undefined));
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('passes a defined value to a ChildPart', () => {
    render(html`<div>${ifDefined('a')}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>a</div>');
  });

  test('passes an undefined value to a ChildPart', () => {
    render(html`<div>${ifDefined(undefined)}</div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('removes an attribute with an interpolated undefined value', () => {
    render(html`<div foo="it's: ${ifDefined(undefined)}"></div>`, container);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('removes an attribute with multiple undefined values', () => {
    render(
      html`<div
        foo="they're both: ${ifDefined(undefined)}${ifDefined(undefined)}"
      ></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('removes an attribute with one defined then one undefined value', () => {
    render(
      html`<div
        foo="only one is: ${ifDefined('a')}${ifDefined(undefined)}"
      ></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('removes an attribute with one undefined then one defined value', () => {
    render(
      html`<div
        foo="only one is: ${ifDefined(undefined)}${ifDefined('a')}"
      ></div>`,
      container
    );
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
  });

  test('only sets the attribute when the value changed', async () => {
    let setCount = 0;
    const observer = new MutationObserver((records) => {
      setCount += records.length;
    });
    const go = (value: string) =>
      render(html`<div foo="1${ifDefined(value)}"></div>`, container);

    go('a');
    const el = container.firstElementChild!;
    observer.observe(el, {attributes: true});

    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div foo="1a"></div>'
    );
    assert.equal(setCount, 0);

    go('a');
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div foo="1a"></div>'
    );
    assert.equal(setCount, 0);
  });

  test('only removes the attribute when the value changed', () => {
    let removeCount = 0;
    const go = (value: unknown) =>
      render(html`<div foo="1${ifDefined(value)}"></div>`, container);

    go('a');
    const el = container.firstElementChild!;
    const origRemoveAttribute = el.removeAttribute.bind(el);
    el.removeAttribute = (name: string) => {
      removeCount++;
      origRemoveAttribute(name);
    };
    assert.equal(
      stripExpressionMarkers(container.innerHTML),
      '<div foo="1a"></div>'
    );
    assert.equal(removeCount, 0);

    go(undefined);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal(removeCount, 1, 'A');

    go(undefined);
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div></div>');
    assert.equal(removeCount, 1, 'B');
  });

  test('only sets node text value changed', async () => {
    let setCount = 0;
    const observer = new MutationObserver((records) => {
      setCount += records.length;
    });
    const go = (value: string) =>
      render(html`<div>${ifDefined(value)}</div>`, container);

    go('a');
    const el = container.firstElementChild!;
    observer.observe(el, {characterData: true});

    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>a</div>');
    assert.equal(setCount, 0);

    go('a');
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(stripExpressionMarkers(container.innerHTML), '<div>a</div>');
    assert.equal(setCount, 0);
  });
});
