/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * This is a server-only module that renders the HTML file shell.
 */

import {render} from '../../lib/render-lit-html.js';
import {template, initialData, renderApp} from '../template.js';

export function renderAppWithInitialData() {
  return renderApp(() => render(template(initialData)));
}
