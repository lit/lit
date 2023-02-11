/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';
import {getSourceFilename, languages} from '../utils.js';

import {
  createPackageAnalyzer,
  Analyzer,
  AbsolutePath,
  Module,
} from '../../index.js';

for (const lang of languages) {
  const test = suite<{
    analyzer: Analyzer;
    packagePath: AbsolutePath;
    module: Module;
  }>(`Module tests (${lang})`);

  test.before((ctx) => {
    try {
      const packagePath = fileURLToPath(
        new URL(`../../test-files/${lang}/functions`, import.meta.url).href
      ) as AbsolutePath;
      const analyzer = createPackageAnalyzer(packagePath);

      const result = analyzer.getPackage();
      const file = getSourceFilename('functions', lang);
      const module = result.modules.find((m) => m.sourcePath === file);
      if (module === undefined) {
        throw new Error(`Analyzer did not analyze file '${file}'`);
      }

      ctx.packagePath = packagePath;
      ctx.analyzer = analyzer;
      ctx.module = module;
    } catch (error) {
      // Uvu has a bug where it silently ignores failures in before and after,
      // see https://github.com/lukeed/uvu/issues/191.
      console.error('uvu before error', error);
      process.exit(1);
    }
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

  test('Const function', ({module}) => {
    const exportedFn = module.getResolvedExport('constFunction');
    const fn = module.getDeclaration('constFunction');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `constFunction`);
    assert.equal(fn.summary, `Const function summary\nwith wraparound`);
    assert.equal(fn.description, `Const function description\nwith wraparound`);
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
    assert.equal(fn.return?.description, 'Const function return description');
    assert.equal(fn.deprecated, 'Const function deprecated');
  });

  test('Const arrow function', ({module}) => {
    const exportedFn = module.getResolvedExport('constArrowFunction');
    const fn = module.getDeclaration('constArrowFunction');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `constArrowFunction`);
    assert.equal(fn.summary, `Const arrow function summary\nwith wraparound`);
    assert.equal(
      fn.description,
      `Const arrow function description\nwith wraparound`
    );
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
    assert.equal(
      fn.return?.description,
      'Const arrow function return description'
    );
    assert.equal(fn.deprecated, 'Const arrow function deprecated');
  });

  test('Async function', ({module}) => {
    const exportedFn = module.getResolvedExport('asyncFunction');
    const fn = module.getDeclaration('asyncFunction');
    assert.equal(fn, exportedFn);
    assert.ok(fn?.isFunctionDeclaration());
    assert.equal(fn.name, `asyncFunction`);
    assert.equal(fn.description, `Async function description`);
    assert.equal(fn.summary, undefined);
    assert.equal(fn.parameters?.[0].name, 'a');
    assert.equal(fn.parameters?.[0].description, 'Param a description');
    assert.equal(fn.parameters?.[0].summary, undefined);
    assert.equal(fn.parameters?.[0].type?.text, 'string');
    assert.equal(fn.parameters?.[0].default, undefined);
    assert.equal(fn.parameters?.[0].rest, false);
    assert.equal(fn.return?.type?.text, 'Promise<string>');
    assert.equal(fn.return?.description, 'Async function return description');
    assert.equal(fn.deprecated, 'Async function deprecated');
  });

  test.run();
}
