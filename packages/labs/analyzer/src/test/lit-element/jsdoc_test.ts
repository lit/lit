/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import {
  AnalyzerTestContext,
  getSourceFilename,
  InMemoryAnalyzer,
  languages,
  setupAnalyzerForTest,
} from '../utils.js';

import {AbsolutePath} from '../../index.js';

for (const lang of languages) {
  const test = suite<AnalyzerTestContext>(`JSDoc tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'jsdoc');
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

  // Class description, summary, deprecated

  test('tagged description and summary', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('TaggedDescription');
    assert.ok(element.isLitElementDeclaration());
    assert.equal(
      element.description,
      `TaggedDescription description. Lorem ipsum dolor sit amet, consectetur
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat.`
    );
    assert.equal(element.summary, `TaggedDescription summary.`);
    assert.equal(element.deprecated, `TaggedDescription deprecated message.`);
  });

  test('untagged description', ({getModule}) => {
    const element = getModule('element-a').getDeclaration(
      'UntaggedDescription'
    );
    assert.ok(element.isLitElementDeclaration());
    assert.equal(
      element.description,
      `UntaggedDescription description. Lorem ipsum dolor sit amet, consectetur
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
nisi ut aliquip ex ea commodo consequat.`
    );
    assert.equal(element.summary, `UntaggedDescription summary.`);
    assert.equal(element.deprecated, `UntaggedDescription deprecated message.`);
  });

  // Fields

  test('field1', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field1');
    assert.ok(member?.isClassField());
    assert.equal(
      member.description,
      `Class field 1 description\nwith wraparound`
    );
    assert.equal(member.default, `'default1'`);
    assert.equal(member.privacy, 'private');
    assert.equal(member.type?.text, 'string');
  });

  test('field2', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field2');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Class field 2 summary\nwith wraparound`);
    assert.equal(
      member.description,
      `Class field 2 description\nwith wraparound`
    );
    assert.equal(member.default, undefined);
    assert.equal(member.privacy, 'protected');
    assert.equal(member.type?.text, 'string | number');
  });

  test('field3', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field3');
    assert.ok(member?.isClassField());
    assert.equal(
      member.description,
      `Class field 3 description\nwith wraparound`
    );
    assert.equal(member.default, undefined);
    assert.equal(member.privacy, 'public');
    assert.equal(member.type?.text, 'string');
    assert.equal(member.deprecated, true);
  });

  test('field4', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getField('field4');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Class field 4 summary\nwith wraparound`);
    assert.equal(
      member.description,
      `Class field 4 description\nwith wraparound`
    );
    assert.equal(
      member.default,
      `new Promise${lang === 'ts' ? '<void>' : ''}((r) => r())`
    );
    assert.equal(member.type?.text, 'Promise<void>');
    assert.equal(member.deprecated, 'Class field 4 deprecated');
  });

  test('static field1', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getStaticField('field1');
    assert.ok(member?.isClassField());
    assert.equal(member.summary, `Static class field 1 summary`);
    assert.equal(member.description, `Static class field 1 description`);
    assert.equal(member.default, undefined);
    assert.equal(member.privacy, 'protected');
    assert.equal(member.type?.text, 'string | number');
  });

  // Methods

  test('method1', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getMethod('method1');
    assert.ok(member?.isClassMethod());
    assert.equal(member.description, `Method 1 description\nwith wraparound`);
    assert.equal(member.parameters?.length, 0);
    assert.equal(member.return?.type?.text, 'void');
  });

  test('method2', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getMethod('method2');
    assert.ok(member?.isClassMethod());
    assert.equal(member.summary, `Method 2 summary\nwith wraparound`);
    assert.equal(member.description, `Method 2 description\nwith wraparound`);
    assert.equal(member.parameters?.length, 3);
    assert.equal(member.parameters?.[0].name, 'a');
    assert.equal(member.parameters?.[0].description, 'Param a description');
    assert.equal(member.parameters?.[0].summary, undefined);
    assert.equal(member.parameters?.[0].type?.text, 'string');
    assert.equal(member.parameters?.[0].default, undefined);
    assert.equal(member.parameters?.[0].rest, false);
    assert.equal(member.parameters?.[1].name, 'b');
    assert.equal(
      member.parameters?.[1].description,
      'Param b description\nwith wraparound'
    );
    assert.equal(member.parameters?.[1].type?.text, 'boolean');
    assert.equal(member.parameters?.[1].optional, true);
    assert.equal(member.parameters?.[1].default, 'false');
    assert.equal(member.parameters?.[1].rest, false);
    assert.equal(member.parameters?.[2].name, 'c');
    assert.equal(member.parameters?.[2].description, 'Param c description');
    assert.equal(member.parameters?.[2].summary, undefined);
    assert.equal(member.parameters?.[2].type?.text, 'number[]');
    assert.equal(member.parameters?.[2].optional, false);
    assert.equal(member.parameters?.[2].default, undefined);
    assert.equal(member.parameters?.[2].rest, true);
    assert.equal(member.return?.type?.text, 'string');
    assert.equal(member.return?.description, 'Method 2 return description');
    assert.equal(member.deprecated, 'Method 2 deprecated');
  });

  test('static method1', ({getModule}) => {
    const element = getModule('element-a').getDeclaration('ElementA');
    assert.ok(element.isClassDeclaration());
    const member = element.getStaticMethod('method1');
    assert.ok(member?.isClassMethod());
    assert.equal(member.summary, `Static method 1 summary`);
    assert.equal(member.description, `Static method 1 description`);
    assert.equal(member.parameters?.length, 3);
    assert.equal(member.parameters?.[0].name, 'a');
    assert.equal(member.parameters?.[0].description, 'Param a description');
    assert.equal(member.parameters?.[0].summary, undefined);
    assert.equal(member.parameters?.[0].type?.text, 'string');
    assert.equal(member.parameters?.[0].default, undefined);
    assert.equal(member.parameters?.[0].rest, false);
    assert.equal(member.parameters?.[1].name, 'b');
    assert.equal(member.parameters?.[1].description, 'Param b description');
    assert.equal(member.parameters?.[1].type?.text, 'boolean');
    assert.equal(member.parameters?.[1].optional, true);
    assert.equal(member.parameters?.[1].default, 'false');
    assert.equal(member.parameters?.[1].rest, false);
    assert.equal(member.parameters?.[2].name, 'c');
    assert.equal(member.parameters?.[2].description, 'Param c description');
    assert.equal(member.parameters?.[2].summary, undefined);
    assert.equal(member.parameters?.[2].type?.text, 'number[]');
    assert.equal(member.parameters?.[2].optional, false);
    assert.equal(member.parameters?.[2].default, undefined);
    assert.equal(member.parameters?.[2].rest, true);
    assert.equal(member.return?.type?.text, 'string');
    assert.equal(
      member.return?.description,
      'Static method 1 return description'
    );
    assert.equal(member.deprecated, 'Static method 1 deprecated');
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

    moduleTest.run();
  }
}
