/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import 'lit/experimental-hydrate-support.js';
import {executeServerCommand} from '@web/test-runner-commands';
import {hydrateShadowRoots} from '@webcomponents/template-shadowroot';

import type {LitElement, TemplateResult} from 'lit';
import {Command, Payload} from '../web-test-runner/litSsrPlugin.js';

// Enhance DOMParser's parseFromSTring method to include `includeShadowRoots`
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

interface SsrFixtureOption {
  modules: string[];
  hydrate?: boolean;
}

/**
 * Renders the provided lit-html template with a Lit element server-side by
 * executing a custom command for Web Test Runner provided by the Lit SSR
 * Plugin, loads it to the document and (optionally) hydrates it, returning the
 * element.
 *
 * This module **must** be imported before any custom element definitions.
 *
 * @param {TemplateResult} template - lit-html template. Must contain a single
 * top level custom element.
 * @param {string[]} option.modules - Path to custom element definition modules
 * needed to render template, relative to the project root.
 * @param {boolean} [option.hydrate] - Defaults to true. Hydrates the component
 * after being loaded to the document.
 */
export async function ssrFixture(
  template: TemplateResult,
  {modules, hydrate = true}: SsrFixtureOption
): Promise<Element | null | undefined> {
  const rendered: string = await executeServerCommand<Command, Payload>(
    'lit-ssr-render',
    {
      template,
      modules,
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

  const el = container.firstElementChild as LitElement;
  if (hydrate) {
    // TODO(augustinekim) Consider handling cases where el is not a LitElement
    el.removeAttribute('defer-hydration');
    await el.updateComplete;
  }
  return el;
}
