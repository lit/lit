/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as path from 'path';
import {fileURLToPath} from 'url';

import {Analyzer} from '../../lib/analyzer.js';
import {AbsolutePath} from '../../lib/paths.js';
import {
  ClassDeclaration,
  LitElementDeclaration,
  MixinDeclaration,
} from '../../lib/model.js';

const test = suite<{analyzer: Analyzer; packagePath: AbsolutePath}>(
  'LitElement tests'
);

test.before((ctx) => {
  try {
    const packagePath = (ctx.packagePath = fileURLToPath(
      new URL('../../test-files/mixins', import.meta.url).href
    ) as AbsolutePath);
    ctx.analyzer = new Analyzer(packagePath);
  } catch (error) {
    // Uvu has a bug where it silently ignores failures in before and after,
    // see https://github.com/lukeed/uvu/issues/191.
    console.error('uvu before error', error);
    process.exit(1);
  }
});

test('mixin declaration', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const module = result.modules.find(
    (m) => m.sourcePath === path.normalize('src/mixin.ts')
  );
  const decl = module!.declarations.find(
    (d) => d.name === 'Highlightable'
  ) as MixinDeclaration;
  assert.instance(decl, MixinDeclaration);
  assert.instance(decl.classDeclaration, ClassDeclaration);
  assert.instance(decl.classDeclaration, LitElementDeclaration);
  const classDecl = decl.classDeclaration as LitElementDeclaration;
  assert.equal(classDecl.name, 'HighlightableElement');
  assert.ok(classDecl.reactiveProperties.get('highlight'));
});

test('mixin usage', ({analyzer}) => {
  const result = analyzer.analyzePackage();
  const module = result.modules.find(
    (m) => m.sourcePath === path.normalize('src/element-a.ts')
  );
  const decl = module!.declarations.find(
    (d) => d.name === 'ElementA'
  ) as LitElementDeclaration;
  assert.instance(decl, LitElementDeclaration);
  assert.equal(decl.mixins.length, 1);
});

test.run();
