/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {render} from 'lit';
import {nextFrame} from '../utils.js';
import {createContainer} from './fixture-wrapper.js';

import type {LitElement, TemplateResult} from 'lit';
import type {FixtureOptions} from './fixture-options.js';

/**
 * Renders the provided Lit template client-side.
 */
export async function csrFixture<T extends HTMLElement>(
  template: TemplateResult,
  {modules, base}: FixtureOptions
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
    const {stack} = new Error();
    // host.containers.internal represents the host address when running browser/tests inside a container.
    const match =
      stack?.match(
        /http:\/\/(localhost|host\.containers\.internal).+(?=\?wtr-session-id)/
      ) ??
      // Looking for wtr-session-id might not work in webkit. See https://github.com/lit/lit/issues/4067
      // As a fallback, we look for the first file which is not inside node_modules and
      // is not this csr-fixture file.
      //
      // Webkit Stack:
      // @http://localhost:8000/lib/fixtures/ssr-fixture.js:38:36
      // ssrFixture@http://localhost:8000/lib/fixtures/ssr-fixture.js:19:34
      // ssrNonHydratedFixture@http://localhost:8000/lib/fixtures/ssr-fixture.js:98:45
      // @http://localhost:8000/test/my-element_test.js:20:37
      [
        ...(stack?.matchAll(
          /http:\/\/(localhost|host\.containers\.internal):?[^:)]+/gm
        ) ?? []),
      ]
        .map((m) => m[0])
        .filter(
          (u) =>
            !u.includes('/node_modules/') &&
            !u.includes('/lib/fixtures/csr-fixture.js')
        );
    if (!match) {
      throw new Error(
        `Could not find call site for csrFixture in stack:\n${stack}`
      );
    }
    base = match[0];
  }

  const container = createContainer();

  await Promise.all(
    modules.map((module) => import(new URL(module, base).href))
  );

  render(template, container);

  const el = container.firstElementChild;

  await ((el as LitElement)?.updateComplete || nextFrame());

  return el as T;
}
