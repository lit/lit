/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {assert} from 'chai';
import {msg, str} from '../lit-localize.js';
import {html, render} from 'lit';

const removeHtmlComments = (htmlStr: string) =>
  htmlStr.replace(/<!--.*?-->/g, '');

suite('default localization configuration', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(async () => {
    document.body.removeChild(container);
  });

  test('renders string without expression', () => {
    render(msg(`Hello World`), container);
    assert.equal(removeHtmlComments(container.innerHTML), 'Hello World');
  });

  test('renders string template with expression', () => {
    const name = 'friend';
    render(msg(str`Hello ${name}`), container);
    assert.equal(removeHtmlComments(container.innerHTML), 'Hello friend');
  });

  test('renders Lit template without expression', () => {
    render(msg(html`Hello <b>World</b>`), container);
    assert.equal(removeHtmlComments(container.innerHTML), 'Hello <b>World</b>');
  });

  test('renders Lit template with expression', () => {
    const name = 'friend';
    render(msg(html`Hello <b>${name}</b>`), container);
    assert.equal(
      removeHtmlComments(container.innerHTML),
      'Hello <b>friend</b>'
    );
  });
});
