/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {render} from 'lit';
import type {TemplateResult} from 'lit';
import type {FixtureOption} from './fixtureOption.js';

/**
 * Renders the provided lit-html template with a Lit element client-side.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the project root.
 * @param {string} option.base - Base path for the module. Genenrally should be
 * `import.meta.url`.
 */
export async function csrFixture(
  template: TemplateResult,
  {modules, base}: FixtureOption
) {
  // TODO(augustinekim) Clean up the container from the document
  const container = document.createElement('div');
  document.body.appendChild(container);

  await Promise.all(
    modules.map((module) => import(new URL(module, base).href))
  );

  // Webkit does not seem to render the contents of the custom element
  // synchronously. Awaiting for the next microtask tick seems to work.
  await render(template, container);

  return container.firstElementChild;
}
