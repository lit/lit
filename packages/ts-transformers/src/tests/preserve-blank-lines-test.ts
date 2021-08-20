/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
import {compileTsFragment, CompilerHostCache} from './compile-ts-fragment.js';
import * as ts from 'typescript';
import * as assert from 'uvu/assert';
import * as prettier from 'prettier';
import preserveBlankLinesTransformer from '../preserve-blank-lines.js';

const cache = new CompilerHostCache();

/**
 * Compile the given fragment of TypeScript source code using
 * preserveBlankLinesTransformer. Check that there are no errors and that the
 * output matches (prettier-formatted).
 */
function checkTransform(inputTs: string, expectedJs: string) {
  const options = ts.getDefaultCompilerOptions();
  options.target = ts.ScriptTarget.ESNext;
  options.module = ts.ModuleKind.ESNext;
  // Don't automatically load typings from nodes_modules/@types, we're not using
  // them here, so it's a waste of time.
  options.typeRoots = [];
  const result = compileTsFragment(inputTs, __dirname, options, cache, () => ({
    before: [preserveBlankLinesTransformer()],
  }));

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
  assert.is(formattedActual, formattedExpected);
  assert.equal(
    result.diagnostics.map((diagnostic) =>
      ts.formatDiagnostic(diagnostic, result.host)
    ),
    []
  );
}

test('empty file', () => {
  const input = ``;
  const expected = ``;
  checkTransform(input, expected);
});

test('no blank lines', () => {
  const input = `
    import 'foo';
    class Foo {
      foo() {}
      bar() {}
    }
  `;
  const expected = `
    import 'foo';
    class Foo {
      foo() {}
      bar() {}
    }
  `;
  checkTransform(input, expected);
});

test('blank line after imports', () => {
  const input = `
  import 'foo';
  import 'bar';

  class Foo {
    foo() {}
    bar() {}
  }
  `;
  const expected = `
    import 'foo';
    import 'bar';
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    class Foo {
      foo() {}
      bar() {}
    }
  `;
  checkTransform(input, expected);
});

test('blank line between methods', () => {
  const input = `
    class Foo {
      foo() {}
      
      bar() {}
    }
  `;
  const expected = `
    class Foo {
      foo() {}
      //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
      bar() {}
    }
  `;
  checkTransform(input, expected);
});

test('multiple blank lines between methods', () => {
  const input = `
    class Foo {
      foo() {}
      

      bar() {}
    }
  `;
  const expected = `
    class Foo {
      foo() {}
      //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
      //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
      bar() {}
    }
  `;
  checkTransform(input, expected);
});

test('multiple comments and blank lines preceding a class', () => {
  const input = `
    import 'foo';

    // Comment 1
    //

    /* Comment 2 */


    /**
     * Comment 3
     */

    // Comment 4

    class Foo {
    }
  `;
  const expected = `
    import 'foo';
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    // Comment 1
    //
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    /* Comment 2 */
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    /**
     * Comment 3
     */
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    // Comment 4
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    class Foo {
    }
  `;
  checkTransform(input, expected);
});

test('blank lines and comments between variables', () => {
  const input = `
    /* Comment 1 */
    const foo = "foo";


    // Comment 2
    // Comment 3
    const bar = "bar";

    const baz = "baz";

    const qux =

      "qux";
  `;
  const expected = `
    /* Comment 1 */
    const foo = "foo";
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    // Comment 2
    // Comment 3
    const bar = "bar";
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    const baz = "baz";
    //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    const qux =
      //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
      "qux";
  `;
  checkTransform(input, expected);
});

test('blank lines inside template string placeholder', () => {
  const input = `
    const foo = \`\${

      123

    }\`;
  `;
  const expected = `
    const foo = \`\${
      //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
      123
      //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
    }\`;
  `;
  checkTransform(input, expected);
});

test('blank line and comment before return statement', () => {
  const input = `
    function foo() {

      // Comment
      return "Hello";
    }`;

  const expected = `
    function foo() {
      //__BLANK_LINE_PLACEHOLDER_G1JVXUEBNCL6YN5NFE13MD1PT3H9OIHB__
      // Comment
      return "Hello";
    }`;
  checkTransform(input, expected);
});

test.run();
