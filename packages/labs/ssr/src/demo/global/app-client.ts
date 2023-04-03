/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a client-only file used to boot the page.
 */

import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {render} from 'lit';
import {hydrate} from '@lit-labs/ssr-client';
import {template, initialData} from './module.js';

console.log('Page hydrating with same data as rendered with SSR.');
// The hydrate() function is run with the same data as used in the server
// render. It doesn't update the DOM, and just updates the lit-html part values
// so that future renders() will do the minimal DOM updates.
hydrate(template(initialData), window.document.body);

window.setTimeout(() => {
  console.log('Page updating with new data...');
  // The first call to render() can use new data, and will only update the DOM
  // where this data differs from that passed to hydrate().
  render(
    template({
      name: 'Hydration',
      message: 'We have now been hydrated and updated with new data.',
      items: ['hy', 'dra', 'ted'],
      prop: 'prop-updated',
      attr: 'attr-updated',
      wasUpdated: true,
    }),
    window.document.body
  );
}, 0);
