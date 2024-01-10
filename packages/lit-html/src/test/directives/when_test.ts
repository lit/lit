/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html} from 'lit-html';
import {makeAssertRender} from '../test-utils/assert-render.js';

import {when} from 'lit-html/directives/when.js';

suite('when', () => {
  let container: HTMLDivElement;

  const assertRender = makeAssertRender(() => container);

  setup(() => {
    container = document.createElement('div');
  });

  test('true condition with false case', () => {
    assertRender(
      when(
        true,
        () => html`X`,
        () => html`Y`
      ),
      'X'
    );
  });

  test('true condition without false case', () => {
    assertRender(
      when(true, () => html`X`),
      'X'
    );
  });

  test('false condition with false case', () => {
    assertRender(
      when(
        false,
        () => html`X`,
        () => html`Y`
      ),
      'Y'
    );
  });

  test('false condition without false case', () => {
    assertRender(
      when(false, () => html`X`),
      ''
    );
  });
});
