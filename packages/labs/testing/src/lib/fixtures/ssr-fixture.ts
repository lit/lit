/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {executeServerCommand} from '@web/test-runner-commands';
import {hydrateShadowRoots} from '@webcomponents/template-shadowroot';
import {litSsrPluginCommand} from '../constants.js';

import type {LitElement, TemplateResult} from 'lit';
import type {FixtureOptions, SsrFixtureOptions} from './fixture-options.js';
import type {Payload} from '../lit-ssr-plugin.js';

// Enhance DOMParser's parseFromString method to include `includeShadowRoots`
// option for browsers that support declarative shadow DOM as proposed in
// https://github.com/mfreed7/declarative-shadow-dom/blob/master/README.md#mitigation.
declare global {
  interface DOMParser {
    parseFromString(
      string: string,
      type: DOMParserSupportedType,
      option: {includeShadowRoots: boolean}
    ): Document;
  }
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document and (optionally) hydrates it, returning the
 * element.
 *
 * This module **must** be imported before any custom element definitions.
 */
export async function ssrFixture<T extends LitElement>(
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
    const match = new Error().stack?.match(
      /http:\/\/localhost.+(?=\?wtr-session-id)/
    );
    if (!match) {
      throw new Error('Could not find call site for ssrFixture');
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
  // TODO(augustinekim) Clean up the container from the document
  const container = document.createElement('div');
  document.body.appendChild(container);

  if (HTMLTemplateElement.prototype.hasOwnProperty('shadowRoot')) {
    // Browser natively supports declarative shadowroot but must use DOMParser
    const fragment = new DOMParser().parseFromString(rendered, 'text/html', {
      includeShadowRoots: true,
    });
    container.replaceChildren(...Array.from(fragment.body.childNodes));
  } else {
    // Utilize ponyfill
    container.innerHTML = rendered;
    hydrateShadowRoots(container);
  }

  const el = container.firstElementChild as T;
  if (hydrate) {
    // TODO(augustinekim) Consider handling cases where el is not a LitElement
    el.removeAttribute('defer-hydration');
    await el.updateComplete;
  }
  return el;
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document and hydrates it, returning the element.
 *
 * This module **must** be imported before any custom element definitions.
 */
export async function ssrHydratedFixture<T extends LitElement>(
  template: TemplateResult,
  {modules, base}: FixtureOptions
) {
  return ssrFixture<T>(template, {modules, base, hydrate: true});
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document **without** hydrating it, returning the
 * element.
 *
 * This module **must** be imported before any custom element definitions.
 */
export async function ssrNonHydratedFixture<T extends LitElement>(
  template: TemplateResult,
  {modules, base}: FixtureOptions
) {
  return ssrFixture<T>(template, {modules, base, hydrate: false});
}
