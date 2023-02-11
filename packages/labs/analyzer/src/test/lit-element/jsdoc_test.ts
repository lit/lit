/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {fileURLToPath} from 'url';
import {getSourceFilename, InMemoryAnalyzer, languages} from '../utils.js';

import {createPackageAnalyzer, Module, AbsolutePath} from '../../index.js';

for (const lang of languages) {
  const test = suite<{
    getModule: (name: string) => Module;
  }>(`LitElement event tests (${lang})`);

  test.before((ctx) => {
    try {
      const packagePath = fileURLToPath(
        new URL(`../../test-files/${lang}/jsdoc`, import.meta.url).href
      ) as AbsolutePath;
      const analyzer = createPackageAnalyzer(packagePath);
      ctx.getModule = (name: string) =>
        analyzer.getModule(
          getSourceFilename(
            analyzer.path.join(packagePath, name),
            lang
          ) as AbsolutePath
        );
    } catch (error) {
      // Uvu has a bug where it silently ignores failures in before and after,
      // see https://github.com/lukeed/uvu/issues/191.
      console.error('uvu before error', error);
      process.exit(1);
    }
  });

  // slots

  test('slots - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.slots.size, 4);
  });

  test('slots - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('no-description');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, undefined);
  });

  test('slots - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-description');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(
      slot.description,
      'Description for with-description\nwith wraparound'
    );
  });

  test('slots - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const slot = element.slots.get('with-description-dash');
    assert.ok(slot);
    assert.equal(slot.summary, undefined);
    assert.equal(slot.description, 'Description for with-description-dash');
  });

  // cssParts

  test('cssParts - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.cssParts.size, 3);
  });

  test('cssParts - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('no-description');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(part.description, undefined);
  });

  test('cssParts - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-description');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(
      part.description,
      'Description for :part(with-description)\nwith wraparound'
    );
  });

  test('cssParts - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const part = element.cssParts.get('with-description-dash');
    assert.ok(part);
    assert.equal(part.summary, undefined);
    assert.equal(
      part.description,
      'Description for :part(with-description-dash)'
    );
  });

  // cssProperties

  test('cssProperties - Correct number found', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(element.cssProperties.size, 6);
  });

  test('cssProperties - no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --with-description\nwith wraparound'
    );
  });

  test('cssProperties - with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, 'Description for --with-description-dash');
  });

  test('cssProperties - short-no-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-no-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(prop.description, undefined);
  });

  test('cssProperties - short-with-description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --short-with-description\nwith wraparound'
    );
  });

  test('cssProperties - short-with-description-dash', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isLitElementDeclaration());
    const prop = element.cssProperties.get('--short-with-description-dash');
    assert.ok(prop);
    assert.equal(prop.summary, undefined);
    assert.equal(
      prop.description,
      'Description for --short-with-description-dash'
    );
  });

  test.run();

  // Doing module JSDoc tests in-memory, to test a number of variations
  // without needing to maintain a file for each.

  for (const hasFirstStatementDoc of [false, true]) {
    const moduleTest = suite<{
      analyzer: InMemoryAnalyzer;
    }>(
      `Module jsDoc tests, ${
        hasFirstStatementDoc ? 'has' : 'no'
      } first statement docs (${lang})`
    );

    moduleTest.before.each((ctx) => {
      ctx.analyzer = new InMemoryAnalyzer(lang, {
        '/package.json': JSON.stringify({name: '@lit-internal/in-memory-test'}),
      });
    });

    const firstStatementDoc = hasFirstStatementDoc
      ? `
      /**
       * First statement description
       * @summary First statement summary
       */
    `
      : '';

    moduleTest('untagged module description with @module tag', ({analyzer}) => {
      analyzer.setFile(
        '/module',
        `
          /**
           * Module description
           * more description
           * @module
           */
          ${firstStatementDoc}
          export const foo = 42;
        `
      );
      const module = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.equal(module.description, 'Module description\nmore description');
    });

    moduleTest(
      'untagged module description with @fileoverview tag',
      ({analyzer}) => {
        analyzer.setFile(
          '/module',
          `
          /**
           * Module description
           * more description
           * @fileoverview
           */
          ${firstStatementDoc}
          export const foo = 42;
        `
        );
        const module = analyzer.getModule(
          getSourceFilename('/module', lang) as AbsolutePath
        );
        assert.equal(
          module.description,
          'Module description\nmore description'
        );
      }
    );

    moduleTest('module description in @fileoverview tag', ({analyzer}) => {
      analyzer.setFile(
        '/module',
        `
          /**
           * @fileoverview Module description
           * more description
           */
          ${firstStatementDoc}
          export const foo = 42;
        `
      );
      const module = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.equal(module.description, 'Module description\nmore description');
    });

    moduleTest(
      'untagged module description with @packageDocumentation tag',
      ({analyzer}) => {
        analyzer.setFile(
          '/module',
          `
          /**
           * Module description
           * more description
           * @packageDocumentation
           */
          ${firstStatementDoc}
          export const foo = 42;
        `
        );
        const module = analyzer.getModule(
          getSourceFilename('/module', lang) as AbsolutePath
        );
        assert.equal(
          module.description,
          'Module description\nmore description'
        );
      }
    );

    moduleTest(
      'module description in @packageDocumentation tag',
      ({analyzer}) => {
        analyzer.setFile(
          '/module',
          `
          /**
           * @packageDocumentation Module description
           * more description
           */
          ${firstStatementDoc}
          export const foo = 42;
        `
        );
        const module = analyzer.getModule(
          getSourceFilename('/module', lang) as AbsolutePath
        );
        assert.equal(
          module.description,
          'Module description\nmore description'
        );
      }
    );

    moduleTest(
      'module description in @packageDocumentation tag with other tags',
      ({analyzer}) => {
        analyzer.setFile(
          '/module',
          `
          /**
           * @packageDocumentation Module description
           * more description
           * @module foo
           * @deprecated Module is deprecated
           */
          ${firstStatementDoc}
          export const foo = 42;
        `
        );
        const module = analyzer.getModule(
          getSourceFilename('/module', lang) as AbsolutePath
        );
        assert.equal(
          module.description,
          'Module description\nmore description'
        );
        assert.equal(module.deprecated, 'Module is deprecated');
      }
    );

    moduleTest('untagged module description', ({analyzer}) => {
      analyzer.setFile(
        '/module',
        `
          /**
           * Module description
           * more module description
           * @summary Module summary
           * @deprecated
           */
          /**
           * First statement description
           * @summary First statement summary
           */
          export const foo = 42;
        `
      );
      const module = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.equal(
        module.description,
        'Module description\nmore module description'
      );
      assert.equal(module.summary, 'Module summary');
      assert.equal(module.deprecated, true);
    });

    moduleTest('multiple untagged module descriptions', ({analyzer}) => {
      analyzer.setFile(
        '/module',
        `
          /**
           * Module description
           * more module description
           */
          /**
           * Even more module description
           */
          /**
           * First statement description
           * @summary First statement summary
           */
          export const foo = 42;
        `
      );
      const module = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.equal(
        module.description,
        'Module description\nmore module description\nEven more module description'
      );
    });

    moduleTest(
      'multiple untagged module descriptions with other tags',
      ({analyzer}) => {
        analyzer.setFile(
          '/module',
          `
          /**
           * Module description
           * more module description
           * @deprecated
          */
          /**
           * Even more module description
           * @summary Module summary
           */
          /**
           * First statement description
           * @summary First statement summary
           */
          export const foo = 42;
        `
        );
        const module = analyzer.getModule(
          getSourceFilename('/module', lang) as AbsolutePath
        );
        assert.equal(
          module.description,
          'Module description\nmore module description\nEven more module description'
        );
        assert.equal(module.summary, 'Module summary');
        assert.equal(module.deprecated, true);
      }
    );

    test('basic class analysis', ({getModule}) => {
      const element = getModule('element-a').getDeclaration('ElementA');
      assert.ok(element.isClassDeclaration());
      assert.equal(element.description, 'A cool custom element.');
      const field = element.getField('field1');
      assert.ok(field?.isClassField());
      assert.equal(field.description, `Class field 1 description`);
      assert.equal(field.type?.text, 'string');
      const method = element.getMethod('method1');
      assert.ok(method?.isClassMethod());
      assert.equal(method.description, `Method 1 description`);
      assert.equal(method.parameters?.length, 0);
      assert.equal(method.return?.type?.text, 'void');
    });

    moduleTest.run();
  }
}
