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
import {isServer} from 'lit-html/is-server.js';

const SERVER_ONLY = 1;

export interface ServerRenderedTemplate extends TemplateResult {
  _$litServerRenderMode: typeof SERVER_ONLY;
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
 * Server-only `html` templates can be composed, and combined, and they support
 * almost all features that normal Lit templates do, with the exception of
 * features that don't have a pure HTML representation, like event handlers or
 * property bindings.
 *
 * Server-only `html` templates can only be rendered on the server, they will
 * throw an Error if created in the browser. However if you render a normal Lit
 * template inside a server-only template, then it can be hydrated and updated.
 * Likewise, if you place a custom element inside a server-only template, it can
 * be hydrated and update like normal.
 *
 * A server-only template can't be rendered inside a normal Lit template.
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): ServerRenderedTemplate {
  if (!isServer) {
    throw new Error(
      `server-only templates can only be rendered on the server, they cannot be rendered in the browser. Use the html function for templates that need to be rendered from the browser. This check is based on the "node" export condition: https://nodejs.org/api/packages.html#conditional-exports`
    );
  }
  const value = baseHtml(strings, ...values) as ServerRenderedTemplate;
  value._$litServerRenderMode = SERVER_ONLY;
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
  return template._$litServerRenderMode !== SERVER_ONLY;
};

type MaybeCompiledTemplate = TemplateResult | CompiledTemplateResult;

type MaybeServerTemplate = MaybeCompiledTemplate & {
  _$litServerRenderMode?: typeof SERVER_ONLY;
};
