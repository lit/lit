/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {AbsolutePath} from '../../../lib/paths.js';
import {getSourceFilename, InMemoryAnalyzer, languages} from '../utils.js';

for (const lang of languages) {
  const test = suite<{
    analyzer: InMemoryAnalyzer;
  }>(`Exports tests (${lang})`);

  test.before.each((ctx) => {
    ctx.analyzer = new InMemoryAnalyzer(lang, {
      '/package.json': JSON.stringify({name: '@lit-internal/in-memory-test'}),
    });
  });

  test('local declaration export via export keyword', ({analyzer}) => {
    analyzer.setFile(
      '/a',
      `
      export const a = 'a';
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/a', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'a');
    assert.equal(a.module, undefined);
  });

  test('local declaration export via export statement', ({analyzer}) => {
    analyzer.setFile(
      '/a',
      `
      const a = 'a';
      export {a};
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/a', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'a');
    assert.equal(a.module, undefined);
  });

  test('local declaration export via export statement, renamed', ({
    analyzer,
  }) => {
    analyzer.setFile(
      '/a',
      `
      const aInternal = 'a';
      export {aInternal as a};
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/a', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'aInternal');
    assert.equal(a.module, undefined);
  });

  test('local declaration export via export statement, multiple', ({
    analyzer,
  }) => {
    analyzer.setFile(
      '/a',
      `
      const aInternal = 'a';
      const b = 'b';
      export {aInternal as a, b, aInternal as c};
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/a', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a', 'b', 'c']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'aInternal');
    assert.equal(a.module, undefined);
    const b = module.getExportReference('b');
    assert.equal(b.name, 'b');
    assert.equal(b.module, undefined);
    const c = module.getExportReference('c');
    assert.equal(c.name, 'aInternal');
    assert.equal(c.module, undefined);
  });

  test('reexport via export statement with specifier', ({analyzer}) => {
    analyzer.setFile('/a', `export const a = 'a';`);
    analyzer.setFile(
      '/b',
      `
      export {a} from './a.js';
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
  });

  test('reexport via export statement with specifier, renamed', ({
    analyzer,
  }) => {
    analyzer.setFile('/a', `export const a = 'a';`);
    analyzer.setFile(
      '/b',
      `
      export {a as a2} from './a.js';
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a2']);
    const a = module.getExportReference('a2');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
  });

  test('reexport via export statement with specifier, multiple', ({
    analyzer,
  }) => {
    analyzer.setFile(
      '/a',
      `
      export const a = 'a';
      export const b = 'b';
      `
    );
    analyzer.setFile(
      '/b',
      `
      export {a as a2, b} from './a.js';
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a2', 'b']);
    const a = module.getExportReference('a2');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
    const b = module.getExportReference('b');
    assert.equal(b.name, 'b');
    assert.equal(b.module, 'a.js');
  });

  test('reexport via export statement of imported symbol', ({analyzer}) => {
    analyzer.setFile('/a', `export const a = 'a';`);
    analyzer.setFile(
      '/b',
      `
      import {a} from './a.js'
      export {a};
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
  });

  test('reexport via export statement of renamed imported symbol', ({
    analyzer,
  }) => {
    analyzer.setFile('/a', `export const a = 'a';`);
    analyzer.setFile(
      '/b',
      `
      import {a as a2} from './a.js'
      export {a2};
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a2']);
    const a = module.getExportReference('a2');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
  });

  test('reexport via export statement of renamed imported symbol, renamed', ({
    analyzer,
  }) => {
    analyzer.setFile('/a', `export const a = 'a';`);
    analyzer.setFile(
      '/b',
      `
      import {a as a2} from './a.js'
      export {a2 as a3};
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a3']);
    const a = module.getExportReference('a3');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
  });

  test('reexport via export statement of imported symbols, multiple', ({
    analyzer,
  }) => {
    analyzer.setFile(
      '/a',
      `
      export const a = 'a';
      export const b = 'b';
      export const c = 'c';
      `
    );
    analyzer.setFile(
      '/b',
      `
      import {a} from './a.js'
      import {b, c as c2} from './a.js'
      export {a, b, c2 as c};
      export {c2}
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a', 'b', 'c', 'c2']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
    const b = module.getExportReference('b');
    assert.equal(b.name, 'b');
    assert.equal(b.module, 'a.js');
    const c = module.getExportReference('c');
    assert.equal(c.name, 'c');
    assert.equal(c.module, 'a.js');
    const c2 = module.getExportReference('c2');
    assert.equal(c2.name, 'c');
    assert.equal(c2.module, 'a.js');
  });

  test('export {x as default}', ({analyzer}) => {
    analyzer.setFile(
      '/a',
      `
      const a = 'a';
      const b = 'b';
      export {a as default, b}
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/a', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['b', 'default']);
    const a = module.getExportReference('default');
    assert.equal(a.name, 'a');
    assert.equal(a.module, undefined);
    const b = module.getExportReference('b');
    assert.equal(b.name, 'b');
    assert.equal(b.module, undefined);
  });

  test(`export * from 'module'`, ({analyzer}) => {
    analyzer.setFile(
      '/a',
      `
      export const a = 'a';
      export const b = 'b';
      `
    );
    analyzer.setFile(
      '/b',
      `
      export * from './a.js';
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['a', 'b']);
    const a = module.getExportReference('a');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'a.js');
    const b = module.getExportReference('b');
    assert.equal(b.name, 'b');
    assert.equal(a.module, 'a.js');
  });

  test(`export * from 'module', transitively`, ({analyzer}) => {
    analyzer.setFile(
      '/a',
      `
      export const a = 'a';
      export const b = 'b';
      `
    );
    analyzer.setFile(
      '/b',
      `
      export const c = 'c';
      export const d = 'd';
      export * from './a.js';
      `
    );
    analyzer.setFile(
      '/c',
      `
      export * from './b.js';
      `
    );
    const moduleC = analyzer.getModule(
      getSourceFilename('/c', lang) as AbsolutePath
    );
    assert.equal(moduleC.exportNames.sort(), ['a', 'b', 'c', 'd']);
    const a = moduleC.getExportReference('a');
    assert.equal(a.name, 'a');
    assert.equal(a.module, 'b.js');
    const b = moduleC.getExportReference('b');
    assert.equal(b.name, 'b');
    assert.equal(b.module, 'b.js');
    const c = moduleC.getExportReference('c');
    assert.equal(c.name, 'c');
    assert.equal(c.module, 'b.js');
    const d = moduleC.getExportReference('d');
    assert.equal(d.name, 'd');
    assert.equal(d.module, 'b.js');

    const moduleB = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(moduleB.exportNames.sort(), ['a', 'b', 'c', 'd']);
    const a2 = moduleB.getExportReference('a');
    assert.equal(a2.name, 'a');
    assert.equal(a2.module, 'a.js');
    const b2 = moduleB.getExportReference('b');
    assert.equal(b2.name, 'b');
    assert.equal(a2.module, 'a.js');
    const c2 = moduleB.getExportReference('c');
    assert.equal(c2.name, 'c');
    assert.equal(c2.module, undefined);
    const d2 = moduleB.getExportReference('d');
    assert.equal(d2.name, 'd');
    assert.equal(d2.module, undefined);
  });

  test('export * as ns', ({analyzer}) => {
    analyzer.setFile(
      '/a',
      `
      export const a = 'a';
      export const b = 'b';
      `
    );
    analyzer.setFile(
      '/b',
      `
      export * as ns from './a.js';
      `
    );
    const module = analyzer.getModule(
      getSourceFilename('/b', lang) as AbsolutePath
    );
    assert.equal(module.exportNames.sort(), ['ns']);
    const ns = module.getExportReference('ns');
    assert.equal(ns.name, '*');
    assert.equal(ns.module, 'a.js');
  });

  test.run();
}
