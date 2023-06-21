/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import {compileLitTemplates} from '../lib/template-transform.js';

import {test} from 'uvu';
// eslint-disable-next-line
import * as assert from 'uvu/assert';

test('basic', () => {
  const source = `
import { html } from 'lit-html';
export const sayHello = (name) => html\`<h1>Hello \${name}\${'!'}</h1>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.equal(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<h1>Hello <?><?></h1>", parts: [{ type: 2, index: 2 }, { type: 2, index: 3 }] };
export const sayHello = (name) => ({ _$litType$: lit_template_1, values: [name, '!'] });
`.trim()
  );
});

test('multiple TTLs', () => {
  const source = `
import { html } from 'lit-html';
export const one = html\`<h1>One</h1>\`;
export const two = html\`<h1>Two</h1>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.equal(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
const lit_template_1 = { h: "<h1>One</h1>", parts: [] };
export const one = { _$litType$: lit_template_1, values: [] };
const lit_template_2 = { h: "<h1>Two</h1>", parts: [] };
export const two = { _$litType$: lit_template_2, values: [] };
`.trim()
  );
});

test('defining multiple TTLs in a function', () => {
  const source = `
import { html } from 'lit-html';
function () {
  const one = html\`<h1 class=\${'class-binding'}>One</h1>\`;
  const two = html\`<h1 class=\${'second-class-binding'}>Two</h1>\`;
}
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });

  assert.equal(
    result.outputText.trim(),
    `
import { _$LH as litHtmlPrivate } from "lit-html/private-ssr-support.js";
const { AttributePart, PropertyPart, BooleanAttribute, EventPart } = litHtmlPrivate;
import { html } from 'lit-html';
const lit_template_1 = { h: "<h1>One</h1>", parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: AttributePart }] };
const lit_template_2 = { h: "<h1>Two</h1>", parts: [{ type: 1, index: 0, name: "class", strings: ["", ""], ctor: AttributePart }] };
function () {
    const one = { _$litType$: lit_template_1, values: ['class-binding'] };
    const two = { _$litType$: lit_template_2, values: ['second-class-binding'] };
}
`.trim()
  );
});

test.run();
