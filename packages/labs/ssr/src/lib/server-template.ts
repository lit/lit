/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  html as baseHtml,
  type CompiledTemplateResult,
  type TemplateResult,
} from 'lit-html';

const SERVER_ONLY = 1;

export interface ServerRenderedTemplate extends TemplateResult {
  $_litServerRenderMode: typeof SERVER_ONLY;
}

/**
 * A lit-html template that can only be rendered on the server, and cannot be
 * hydrated.
 *
 * These templates can be used for rendering full documents, including the
 * doctype, and rendering into elements that Lit normally cannot, like
 * `<title>`, `<textarea>`, `<template>`, and non-executing `<script>` tags
 * like `<script type="text/json">`. They are also slightly more efficient than
 * normal Lit templates, because the generated HTML doesn't need to include
 * markers for updating.
 *
 * `serverhtml` templates can be composed, and combined, and they support
 * almost all features that normal Lit templates do, with the exception of
 * features that don't have a pure HTML representation, like event handlers or
 * property bindings.
 *
 * `serverhtml` templates can only be rendered once, so they can't be updated
 * on the client. However if you render a normal Lit template inside a
 * serverhtml template, then it can be hydrated and updated. Likewise, custom
 * elements behave the same in both server-only templates and normal templates,
 * and by default they will hydrate.
 *
 * A `serverhtml` template can't be rendered inside a normal Lit template.
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
