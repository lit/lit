/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
import {compileTsFragment, CompilerHostCache} from './compile-ts-fragment.js';
import ts from 'typescript';
import * as assert from 'uvu/assert';
import prettier from 'prettier';
import {templateCompilerTransformer} from '../template-compiler.js';

const cache = new CompilerHostCache();

/**
 * Compile the given fragment of TypeScript source code using the idiomatic
 * decorator transform. Check that there are no errors and that the output
 * matches (prettier-formatted).
 */
function checkTransform(inputTs: string, expectedJs: string) {
  const options = ts.getDefaultCompilerOptions();
  options.target = ts.ScriptTarget.ESNext;
  options.module = ts.ModuleKind.ESNext;
  options.moduleResolution = ts.ModuleResolutionKind.NodeJs;
  options.importHelpers = true;
  options.typeRoots = [];
  options.experimentalDecorators = true;
  const result = compileTsFragment(
    inputTs,
    process.cwd(),
    options,
    cache,
    () => ({
      before: [templateCompilerTransformer()],
      after: [],
    })
  );

  assert.equal(
    result.diagnostics.map((diagnostic) =>
      ts.formatDiagnostic(diagnostic, result.host)
    ),
    []
  );

  let formattedExpected = prettier.format(expectedJs, {parser: 'typescript'});
  // TypeScript >= 4 will add an empty export statement if there are no imports
  // or exports to ensure this is a module. We don't care about checking this.
  const unformattedActual = (result.code || '').replace('export {};', '');
  let formattedActual;
  try {
    formattedActual = prettier.format(unformattedActual, {
      parser: 'typescript',
    });
  } catch {
    // We might emit invalid TypeScript in a failing test. Rather than fail with
    // a Prettier parse exception, it's more useful to see a diff.
    formattedExpected = expectedJs;
    formattedActual = unformattedActual;
  }
  assert.is(formattedActual, formattedExpected, formattedActual);
}

test('empty file', () => {
  const input = `
  import {LitElement, html} from 'lit';

  export class MyElement extends LitElement {
    protected override render() {
      html\`
        <x-foo .foo=\${'hi'}><span>default</span></x-foo>\`;
    }
  }
`;
  const expected = `
import {LitElement, html} from 'lit';

export class MyElement extends LitElement {
  protected override render() {
    html\`<div></div>\`;
  }
}
`;
  checkTransform(input, expected);
});

test.run();
