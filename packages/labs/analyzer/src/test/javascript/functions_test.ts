/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {
  AnalyzerModuleTestContext,
  languages,
  setupAnalyzerForTestWithModule,
} from '../utils.js';

for (const lang of languages) {
  const test = suite<AnalyzerModuleTestContext>(`Function tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTestWithModule(ctx, lang, 'functions', 'functions');
  });

  test('Function 1', ({module}) => {
    const exportedFn = module.getResolvedExport('function1');
    const fn = module.getDeclaration('function1');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `function1`);
    assert.equal(fn.description, `Function 1 description`);
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 0);
    assert.equal(fn.deprecated, undefined);
  });

  test('Function 2', ({module}) => {
    const exportedFn = module.getResolvedExport('function2');
    const fn = module.getDeclaration('function2');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `function2`);
    assert.equal(fn.summary, `Function 2 summary\nwith wraparound`);
    assert.equal(fn.description, `Function 2 description\nwith wraparound`);
    assert.equal(fn.parameters?.length, 3);
    assert.equal(fn.parameters?.[0].name, 'a');
    assert.equal(fn.parameters?.[0].description, 'Param a description');
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.parameters?.[1].name, 'b');
    assert.equal(
      fn.parameters?.[1].description,
      'Param b description\nwith wraparound'
    );
    assert.equal(fn.parameters?.[1].type?.text, 'boolean');
    assert.equal(fn.parameters?.[1].optional, true);
    assert.equal(fn.parameters?.[1].default, 'false');
    assert.equal(fn.parameters?.[1].rest, false);
    assert.equal(fn.parameters?.[2].name, 'c');
    assert.equal(fn.parameters?.[2].description, 'Param c description');
    assert.equal(fn.parameters?.[2].summary, undefined);
    assert.equal(fn.parameters?.[2].type?.text, 'number[]');
    assert.equal(fn.parameters?.[2].optional, false);
    assert.equal(fn.parameters?.[2].default, undefined);
    assert.equal(fn.parameters?.[2].rest, true);
    assert.equal(fn.return?.type?.text, 'string');
    assert.equal(fn.return?.description, 'Function 2 return description');
    assert.equal(fn.deprecated, 'Function 2 deprecated');
  });

  test('Default function', ({module}) => {
    const exportedFn = module.getResolvedExport('default');
    const fn = module.getDeclaration('default');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `default`);
    assert.equal(fn.description, `Default function description`);
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 0);
    assert.equal(fn.return?.type?.text, 'string');
    assert.equal(fn.return?.description, 'Default function return description');
    assert.equal(fn.deprecated, undefined);
  });

  test('Overloaded function', ({module}) => {
    const exportedFn = module.getResolvedExport('overloaded');
    const fn = module.getDeclaration('overloaded');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `overloaded`);
    assert.equal(
      fn.description,
      `This function has an overloaded signature in TS.`
    );
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 1);
    assert.equal(fn.parameters?.[0].name, 'x');
    assert.equal(
      fn.parameters?.[0].description,
      'Some value, either a string or a number.'
    );
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string | number');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.return?.type?.text, 'string | number');
    assert.equal(
      fn.return?.description,
      'Returns either a string or a number.'
    );
    assert.equal(fn.deprecated, undefined);
  });

  test('Overloaded function with docs only on a non-implementation signature', ({
    module,
  }) => {
    const exportedFn = module.getResolvedExport(
      'overloadedWithDocsOnOverloadOnly'
    );
    const fn = module.getDeclaration('overloadedWithDocsOnOverloadOnly');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `overloadedWithDocsOnOverloadOnly`);
    assert.equal(
      fn.description?.replace(/\n/g, ' '),
      `This is not the implementation signature, but there are no docs on the implementation signature.`
    );
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 1);
    assert.equal(fn.parameters?.[0].name, 'x');
    assert.equal(
      fn.parameters?.[0].description?.replace(/\n/g, ' '),
      'This might be a string or a number, even though this signature only allows strings.'
    );
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string | number');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.return?.type?.text, 'string | number');
    assert.equal(
      fn.return?.description?.replace(/\n/g, ' '),
      'Returns either a string or a number, but this signature only mentions `string`.'
    );
    assert.equal(fn.deprecated, undefined);
  });

  test('Overloaded function with docs on many signatures', ({module}) => {
    const exportedFn = module.getResolvedExport('overloadedWithDocsOnMany');
    const fn = module.getDeclaration('overloadedWithDocsOnMany');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `overloadedWithDocsOnMany`);
    assert.equal(fn.description, `This is the implementation signature.`);
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.length, 1);
    assert.equal(fn.parameters?.[0].name, 'x');
    assert.equal(
      fn.parameters?.[0].description,
      'Maybe a string, maybe a number.'
    );
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string | number');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.return?.type?.text, 'string | number');
    assert.equal(
      fn.return?.description?.replace(/\n/g, ' '),
      'Returns either a string or a number, depending on the mood.'
    );
    assert.equal(fn.deprecated, undefined);
  });

  test.run();
}
