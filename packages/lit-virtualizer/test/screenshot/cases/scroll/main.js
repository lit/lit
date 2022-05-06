/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { virtualize } from '../../../../virtualize.js'
import { html, render } from 'lit-html';

(async function go() {
  const contacts = await(await fetch('../../shared/contacts.json')).json();

  const urlParams = new URLSearchParams(window.location.search);
  const index = Number(urlParams.get('index')) || undefined;
  const position = urlParams.get('position') || undefined;

  const virtualized = html`<div id="main">
    ${virtualize({
      items: contacts,
      renderItem: ({ mediumText }, i) => html`<p>${i}) ${mediumText}</p>`,
      scrollToIndex: { index, position },
    })}
  </div>`;

  render(virtualized, document.body);
})();
