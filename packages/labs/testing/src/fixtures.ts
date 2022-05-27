/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ssrFixture} from './fixtures/ssrFixture.js';

import type {TemplateResult} from 'lit';
import type {FixtureOption} from './fixtures/fixtureOption.js';

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document and hydrates it, returning the element.
 *
 * This module **must** be imported before any custom element definitions.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the project root.
 * @param {string} option.base - Base path for the module. Genenrally should be
 * `import.meta.url`.
 */
export async function ssrHydratedFixture(
  template: TemplateResult,
  {modules, base}: FixtureOption
) {
  return ssrFixture(template, {modules, base, hydrate: true});
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document **without** hydrating it, returning the
 * element.
 *
 * This module **must** be imported before any custom element definitions.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the project root.
 * @param {string} option.base - Base path for the module. Genenrally should be
 * `import.meta.url`.
 */
export async function ssrNonHydratedFixture(
  template: TemplateResult,
  {modules, base}: FixtureOption
) {
  return ssrFixture(template, {modules, base, hydrate: false});
}

export {ssrFixture};
export {csrFixture} from './fixtures/csrFixture.js';
