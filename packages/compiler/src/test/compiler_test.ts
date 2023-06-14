/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import {compile} from '../lib/compiler.js';
import {compileLitTemplates} from '../lib/template-transform.js';
import {_$LH as litHtmlPrivate} from 'lit-html/private-ssr-support.js';

const {marker} = litHtmlPrivate;

import {test} from 'uvu';
// eslint-disable-next-line
import * as assert from 'uvu/assert';

test('meta', () => {
  // TODO: This currently generates the basic-elements out/
  compile('./testdata/basic-elements/tsconfig.json');
  assert.equal(true, true);
});

test('basic', () => {
  const source = `
import { html } from 'lit-html';
export const sayHello = (name) => html \`<h1>Hello \${name}</h1>\`;
  `;
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.ES2020,
    },
    transformers: {before: [compileLitTemplates()]},
  });
  console.log(result.outputText);

  assert.equal(
    result.outputText.trim(),
    `
import { html } from 'lit-html';
var lit_template_1 = { h: "<h1>Hello <?${marker}></h1>", parts: [{ type: 2, index: 2 }] };
export const sayHello = (name) => ({ _$litType$: lit_template_1, values: [name] });
`.trim()
  );
});

test.run();
