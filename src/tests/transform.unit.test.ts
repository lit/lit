/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {litLocalizeTransform} from '../outputters/transform';
import * as ts from 'typescript';
import {Message, makeMessageIdMap} from '../messages';
import test, {ExecutionContext} from 'ava';
import * as prettier from 'prettier';
import {compileTsFragment, CompilerHostCache} from './compile-ts-fragment';

const cache = new CompilerHostCache();
const IMPORT_MSG = `import { msg } from "./lib_client/index.js";\n`;
const IMPORT_LIT_HTML = `import { html } from "lit-html";\n`;

/**
 * Compile the given fragment of TypeScript source code using the lit-localize
 * litLocalizeTransformer with the given translations. Check that there are no errors and
 * that the output matches (prettier-formatted).
 */
function checkTransform(
  t: ExecutionContext,
  inputTs: string,
  expectedJs: string,
  messages: Message[]
) {
  // Rather than fuss with imports in all the test cases, this little hack
  // automatically imports for `msg` and `html` (assuming those strings aren't
  // used with any other meanings).
  if (inputTs.includes('msg')) {
    inputTs = IMPORT_MSG + inputTs;
    // Note we don't expect to see the `msg` import in the output JS, since it
    // should be un-used after litLocalizeTransformation.
  }
  if (inputTs.includes('html')) {
    inputTs = IMPORT_LIT_HTML + inputTs;
    expectedJs = IMPORT_LIT_HTML + expectedJs;
  }
  const options = ts.getDefaultCompilerOptions();
  options.target = ts.ScriptTarget.ES2015;
  options.module = ts.ModuleKind.ESNext;
  options.moduleResolution = ts.ModuleResolutionKind.NodeJs;
  // Don't automatically load typings from nodes_modules/@types, we're not using
  // them here, so it's a waste of time.
  options.typeRoots = [];
  const result = compileTsFragment(inputTs, options, cache, {
    before: [litLocalizeTransform(makeMessageIdMap(messages))],
  });

  let formattedExpected = prettier.format(expectedJs, {parser: 'typescript'});
  let formattedActual;
  try {
    formattedActual = prettier.format(result.code || '', {
      parser: 'typescript',
    });
  } catch {
    // We might emit invalid TypeScript in a failing test. Rather than fail with
    // a Prettier parse exception, it's more useful to see a diff.
    formattedExpected = expectedJs;
    formattedActual = result.code;
  }
  t.is(formattedActual, formattedExpected);
  t.deepEqual(result.diagnostics, []);
}

test('unchanged const', (t) => {
  const src = 'const foo = "foo";';
  checkTransform(t, src, src, []);
});

test('unchanged html', (t) => {
  const src =
    'const foo = "foo"; const bar = "bar"; html`Hello ${foo} and ${bar}!`;';
  checkTransform(t, src, src, []);
});

// TODO(aomarks) The actual tests!
