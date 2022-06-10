/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {render} from 'lit';
import type {LitElement, TemplateResult} from 'lit';
import type {FixtureOption} from './fixture-options.js';

/**
 * Renders the provided lit-html template with a Lit element client-side.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the test file.
 * @param {string} [option.base] - Optional. Base path for the modules.
 * Generally should be `import.meta.url`. Will guess from stack trace if not
 * provided.
 */
export async function csrFixture<T extends LitElement>(
  template: TemplateResult,
  {modules, base}: FixtureOption
): Promise<T> {
  if (base === undefined) {
    // Find the test file url from the call stack
    // Chrome:
    // Error
    // at ssrFixture (http://localhost:8000/node_modules/@lit-labs/testing/lib/fixtures/ssrFixture.js:29:17)
    // at ssrHydratedFixture (http://localhost:8000/node_modules/@lit-labs/testing/lib/fixtures/ssrFixture.js:76:12)
    // at o.<anonymous> (http://localhost:8000/test/my-element_test.js?wtr-session-id=GhB4vW1TXWxXwqgt3F8QD:65:30)
    //
    // Firefox:
    // ssrFixture@http://localhost:8000/node_modules/@lit-labs/testing/lib/fixtures/ssrFixture.js:29:17
    // ssrHydratedFixture@http://localhost:8000/node_modules/@lit-labs/testing/lib/fixtures/ssrFixture.js:76:12
    // @http://localhost:8000/test/my-element_test.js?wtr-session-id=NaCljZAFiyeOoV6-qBqwr:65:30
    //
    // Webkit:
    // @http://localhost:8000/node_modules/@lit-labs/testing/lib/fixtures/ssrFixture.js:29:26
    // asyncFunctionResume@[native code]
    // asyncFunctionResume@[native code]
    // @http://localhost:8000/test/my-element_test.js?wtr-session-id=aKWON-wBOBGyzb2CwIvmK:65:37
    const match = new Error().stack?.match(
      /http:\/\/localhost.+(?=\?wtr-session-id)/
    );
    if (!match) {
      throw new Error('Could not find call site for csrFixture');
    }
    base = match[0];
  }

  // TODO(augustinekim) Clean up the container from the document
  const container = document.createElement('div');
  document.body.appendChild(container);

  await Promise.all(
    modules.map((module) => import(new URL(module, base).href))
  );

  // Webkit does not seem to render the contents of the custom element
  // synchronously. Awaiting for the next microtask tick seems to work.
  await render(template, container);

  return container.firstElementChild as T;
}
