/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  html as baseHtml,
  type CompiledTemplateResult,
  type TemplateResult,
} from 'lit-html';

/**
 * A lit-html template that can only be rendered on the server, and cannot be
 * hydrated.
 *
 * This is a performance optimization, causing the server not to emit comment
 * markers for updating the dynamic parts of the server-rendered DOM, and
 * supports rendering into raw text elements like <title> and <textarea>.
 */
const SERVER_ONLY = 1;

export interface ServerRenderedTemplate extends TemplateResult {
  $_litServerRenderMode: typeof SERVER_ONLY;
}

/**
 * Returns a variant of the given TemplateResult that, when rendered
 * server-side, will not be rendered for client-side hydration.
 *
 * This is a performance optimization, causing the server not to emit comment
 * markers for updating the dynamic parts of the server-rendered DOM.
 * This results in fewer DOM nodes on the client. In most cases the difference
 * will be small.
 *
 * It also allows for data binding into raw text elements like <title> and
 * <textarea>.
 *
 * Currently, a server-only template cannot contain a normal Lit template,
 * and a normal Lit template can't contain a server-only template. We may
 * relax this restriction in the future.
 */
export function serverhtml(
  strings: TemplateStringsArray,
  ...values: unknown[]
): ServerRenderedTemplate {
  const value = baseHtml(strings, ...values) as ServerRenderedTemplate;
  value.$_litServerRenderMode = SERVER_ONLY;
  return value;
}

/**
 * If true, the given template result is from a normal lit-html template, and
 * not a server-only template.
 *
 * Server-only templates are only rendered once, they don't create the
 * marker comments needed to identify and update their dynamic parts.
 */
export const isHydratable = (template: MaybeServerTemplate): boolean => {
  return template.$_litServerRenderMode !== SERVER_ONLY;
};

type MaybeCompiledTemplate = TemplateResult | CompiledTemplateResult;

type MaybeServerTemplate = MaybeCompiledTemplate & {
  $_litServerRenderMode?: typeof SERVER_ONLY;
};
