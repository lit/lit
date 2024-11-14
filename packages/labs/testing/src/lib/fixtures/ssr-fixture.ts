/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {executeServerCommand} from '@web/test-runner-commands';
import {hydrateShadowRoots} from '@webcomponents/template-shadowroot';
import {hydrate as hydrateFunc} from '@lit-labs/ssr-client';
import {createContainer} from './fixture-wrapper.js';
import {litSsrPluginCommand} from '../constants.js';
import {nextFrame} from '../utils.js';

import type {LitElement, TemplateResult} from 'lit';
import type {FixtureOptions, SsrFixtureOptions} from './fixture-options.js';
import type {Payload} from '../lit-ssr-plugin.js';

// Enhance `Element` with method that parses declarative shadow DOM
// See https://github.com/whatwg/html/pull/9538
declare global {
  interface Element {
    setHTMLUnsafe(html: string): void;
  }
}

/**
 * Renders the provided Lit template server-side by executing a custom command
 * for Web Test Runner provided by the Lit SSR Plugin, loads it to the document
 * and (optionally) hydrates it, returning the element.
 *
 * This module **must** be imported before any custom element definitions.
 */
export async function ssrFixture<T extends HTMLElement>(
  template: TemplateResult,
  {modules, base, hydrate = true}: SsrFixtureOptions
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
      // is not this ssr-fixture file.
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
            !u.includes('/lib/fixtures/ssr-fixture.js')
        );
    if (!match) {
      throw new Error(
        `Could not find call site for ssrFixture in stack:\n${stack}`
      );
    }
    base = match[0];
  }

  const rendered = await executeServerCommand<string, Payload>(
    litSsrPluginCommand,
    {
      template,
      modules: modules.map((module) => new URL(module, base).pathname),
    }
  );

  const container = createContainer();

  if (
    HTMLTemplateElement.prototype.hasOwnProperty('shadowRootMode') &&
    'setHTMLUnsafe' in Element.prototype
  ) {
    // Browser natively supports Declarative Shadow DOM and `setHTMLUnsafe()`
    // which is needed for DSD to be parsed and attached.
    container.setHTMLUnsafe(rendered);
  } else {
    // Utilize ponyfill
    container.innerHTML = rendered;
    hydrateShadowRoots(container);
  }

  const el = container.firstElementChild;
  if (hydrate) {
    if (el?.hasAttribute('defer-hydration')) {
      el.removeAttribute('defer-hydration');
      await (el as unknown as LitElement).updateComplete;
    } else {
      hydrateFunc(template, container);
      const litEl = container.querySelector('[defer-hydration]');
      if (litEl) {
        litEl.removeAttribute('defer-hydration');
        await (litEl as LitElement).updateComplete;
      } else {
        await nextFrame();
      }
    }
  }
  return el as T;
}

/**
 * Renders the provided Lit template server-side by executing a custom command
 * for Web Test Runner provided by the Lit SSR Plugin, loads it to the document
 * and hydrates it, returning the element.
 *
 * This module **must** be imported before any custom element definitions.
 */
export async function ssrHydratedFixture<T extends HTMLElement>(
  template: TemplateResult,
  {modules, base}: FixtureOptions
) {
  return ssrFixture<T>(template, {modules, base, hydrate: true});
}

/**
 * Renders the provided Lit template server-side by executing a custom command
 * for Web Test Runner provided by the Lit SSR Plugin, loads it to the document
 * **without** hydrating it, returning the element.
 *
 * This module **must** be imported before any custom element definitions.
 */
export async function ssrNonHydratedFixture<T extends HTMLElement>(
  template: TemplateResult,
  {modules, base}: FixtureOptions
) {
  return ssrFixture<T>(template, {modules, base, hydrate: false});
}
