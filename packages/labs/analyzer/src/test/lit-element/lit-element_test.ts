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
  LitElementDeclaration,
} from '../../index.js';

for (const lang of languages) {
  const test = suite<{analyzer: Analyzer; packagePath: AbsolutePath}>(
    `LitElement tests (${lang})`
  );

  test.before((ctx) => {
    try {
      const packagePath = (ctx.packagePath = fileURLToPath(
        new URL(`../../test-files/${lang}/basic-elements`, import.meta.url).href
      ) as AbsolutePath);
      ctx.analyzer = createPackageAnalyzer(packagePath);
    } catch (error) {
      // Uvu has a bug where it silently ignores failures in before and after,
      // see https://github.com/lukeed/uvu/issues/191.
      console.error('uvu before error', error);
      process.exit(1);
    }
  });

  test('isLitElementDeclaration returns false for non-LitElement', ({
    analyzer,
  }) => {
    const result = analyzer.getPackage();
    const elementAModule = result.modules.find(
      (m) => m.sourcePath === getSourceFilename('not-lit', lang)
    );
    const decl = elementAModule!.declarations.find((d) => d.name === 'NotLit')!;
    assert.ok(decl);
    assert.equal(decl.isLitElementDeclaration(), false);
  });

  test('Analyzer finds LitElement declarations', ({analyzer}) => {
    const result = analyzer.getPackage();
    const elementAModule = result.modules.find(
      (m) => m.sourcePath === getSourceFilename('element-a', lang)
    );
    assert.equal(elementAModule?.declarations.length, 1);
    const decl = elementAModule!.declarations[0];
    assert.equal(decl.name, 'ElementA');
    assert.ok(decl.isLitElementDeclaration());
    assert.equal((decl as LitElementDeclaration).tagname, 'element-a');
  });

  test('Analyzer finds LitElement properties ', ({analyzer}) => {
    const result = analyzer.getPackage();
    const elementAModule = result.modules.find(
      (m) => m.sourcePath === getSourceFilename('element-a', lang)
    );
    const decl = elementAModule!.declarations[0] as LitElementDeclaration;

    // ElementA has `a` and `b` properties
    assert.equal(decl.reactiveProperties.size, 2);

    const aProp = decl.reactiveProperties.get('a');
    assert.ok(aProp);
    assert.equal(aProp.name, 'a', 'property name');
    assert.equal(aProp.attribute, 'a', 'attribute name');
    assert.equal(aProp.type?.text, 'string');
    // TODO (justinfagnani) better assertion
    assert.ok(aProp.type);
    assert.equal(aProp.reflect, false);

    const bProp = decl.reactiveProperties.get('b');
    assert.ok(bProp);
    assert.equal(bProp.name, 'b');
    assert.equal(bProp.attribute, 'bbb');
    assert.equal(bProp.type?.text, 'number');
    assert.equal(bProp.typeOption, 'Number');
  });

  test('Analyzer finds LitElement properties from static getter', ({
    analyzer,
  }) => {
    const result = analyzer.getPackage();
    const elementBModule = result.modules.find(
      (m) => m.sourcePath === getSourceFilename('element-b', lang)
    );
    const decl = elementBModule!.declarations[0] as LitElementDeclaration;

    // ElementB has `foo` and `bar` properties defined in a static properties getter
    assert.equal(decl.reactiveProperties.size, 2);

    const fooProp = decl.reactiveProperties.get('foo');
    assert.ok(fooProp);
    assert.equal(fooProp.name, 'foo', 'property name');
    assert.equal(fooProp.attribute, 'foo', 'attribute name');
    assert.equal(fooProp.type?.text, 'string');
    assert.equal(fooProp.reflect, false);

    const bProp = decl.reactiveProperties.get('bar');
    assert.ok(bProp);
    assert.equal(bProp.name, 'bar');
    assert.equal(bProp.attribute, 'bar');

    // This is inferred
    assert.equal(bProp.type?.text, 'number');
    assert.equal(bProp.typeOption, 'Number');
  });

  test.run();
}
