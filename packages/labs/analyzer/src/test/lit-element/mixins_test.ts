/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
import 'source-map-support/register.js';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';
import {languages} from '../utils.js';

import {Analyzer} from '../../index.js';
import {createPackageAnalyzer} from '../../lib/analyze-package.js';
import {AbsolutePath, PackagePath} from '../../lib/paths.js';
import {ClassDeclaration, LitElementDeclaration} from '../../lib/model.js';

for (const lang of languages) {
  const test = suite<{analyzer: Analyzer; packagePath: AbsolutePath}>(
    `LitElement tests (${lang})`
  );

  test.before((ctx) => {
    try {
      const packagePath = (ctx.packagePath = fileURLToPath(
        new URL(`../../test-files/${lang}/mixins`, import.meta.url).href
      ) as AbsolutePath);
      ctx.analyzer = createPackageAnalyzer(packagePath);
    } catch (error) {
      // Uvu has a bug where it silently ignores failures in before and after,
      // see https://github.com/lukeed/uvu/issues/191.
      console.error('uvu before error', error);
      process.exit(1);
    }
  });

  test('basic mixin declaration', ({analyzer}) => {
    const module = analyzer
      .getPackage()
      .modules.find((m) => m.jsPath === ('mixins.js' as PackagePath));
    assert.ok(module);
    const decl = module.getResolvedExport('Highlightable');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'HighlightableElement');
    assert.ok(classDecl.reactiveProperties.get('highlight'));
  });

  test('basic mixin usage', ({analyzer}) => {
    const module = analyzer
      .getPackage()
      .modules.find((m) => m.jsPath === ('element-a.js' as PackagePath));
    assert.ok(module);
    const decl = module.getResolvedExport('ElementA');
    assert.ok(decl.isLitElementDeclaration());
    assert.ok(decl.heritage.superClass);
    assert.equal(decl.heritage.superClass.name, 'LitElement');
    assert.equal(decl.heritage.mixins.length, 1);
    assert.equal(decl.heritage.mixins[0].name, 'Highlightable');
  });

  test('complex mixin declaration A', ({analyzer}) => {
    const module = analyzer
      .getPackage()
      .modules.find((m) => m.jsPath === ('mixins.js' as PackagePath));
    assert.ok(module);
    const decl = module.getResolvedExport('A');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'A');
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(classDecl.getField('a'));
    }
    assert.ok(classDecl.reactiveProperties.get('a'));
  });

  test('complex mixin declaration B', ({analyzer}) => {
    const module = analyzer
      .getPackage()
      .modules.find((m) => m.jsPath === ('mixins.js' as PackagePath));
    assert.ok(module);
    const decl = module.getResolvedExport('B');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'B');
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(classDecl.getField('b'));
    }
    assert.ok(classDecl.reactiveProperties.get('b'));
  });

  test('complex mixin declaration C', ({analyzer}) => {
    const module = analyzer
      .getPackage()
      .modules.find((m) => m.jsPath === ('mixins.js' as PackagePath));
    assert.ok(module);
    const decl = module.getResolvedExport('C');
    assert.ok(decl.isMixinDeclaration());
    assert.instance(decl.classDeclaration, ClassDeclaration);
    assert.instance(decl.classDeclaration, LitElementDeclaration);
    const classDecl = decl.classDeclaration as LitElementDeclaration;
    assert.equal(classDecl.name, 'C');
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(classDecl.getField('c'));
    }
    assert.ok(classDecl.reactiveProperties.get('c'));
  });

  test('complex mixin usage', ({analyzer}) => {
    const module = analyzer
      .getPackage()
      .modules.find((m) => m.jsPath === ('element-b.js' as PackagePath));
    assert.ok(module);
    const decl = module.getResolvedExport('ElementB');
    assert.ok(decl.isLitElementDeclaration());
    assert.ok(decl.heritage.superClass);
    assert.equal(decl.heritage.superClass.name, 'LitElement');
    assert.equal(decl.heritage.mixins.length, 3);
    assert.equal(decl.heritage.mixins[0].name, 'A');
    const a = decl.heritage.mixins[0].dereference();
    assert.ok(a.isMixinDeclaration());
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(a.classDeclaration.getField('a'));
    }
    assert.ok(a.classDeclaration.isLitElementDeclaration());
    assert.ok(a.classDeclaration.reactiveProperties.get('a'));
    assert.equal(decl.heritage.mixins[1].name, 'B');
    const b = decl.heritage.mixins[1].dereference();
    assert.ok(b.isMixinDeclaration());
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(b.classDeclaration.getField('b'));
    }
    assert.ok(b.classDeclaration.isLitElementDeclaration());
    assert.ok(b.classDeclaration.reactiveProperties.get('b'));
    assert.equal(decl.heritage.mixins[2].name, 'C');
    const c = decl.heritage.mixins[2].dereference();
    assert.ok(c.isMixinDeclaration());
    if (lang === 'ts') {
      //TODO(kschaaf): Add detection of constructor-defined fields to ClassField
      assert.ok(c.classDeclaration.getField('c'));
    }
    assert.ok(c.classDeclaration.isLitElementDeclaration());
    assert.ok(c.classDeclaration.reactiveProperties.get('c'));
  });

  test('mixins applied outside extends clause', ({analyzer}) => {
    const module = analyzer
      .getPackage()
      .modules.find((m) => m.jsPath === ('element-c.js' as PackagePath));
    assert.ok(module);
    const decl = module.getResolvedExport('ElementC');
    assert.ok(decl.isLitElementDeclaration());
    assert.ok(decl.heritage.superClass);
    assert.equal(decl.heritage.superClass.name, 'CBase');
    const superClass = decl.heritage.superClass.dereference(ClassDeclaration);
    assert.ok(superClass);
    assert.ok(superClass.heritage.superClass);
    assert.equal(superClass.heritage.superClass.name, 'LitElement');
    assert.equal(superClass.heritage.mixins.length, 1);
    assert.equal(superClass.heritage.mixins[0].name, 'C');
  });

  test.run();
}
