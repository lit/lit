/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as assert from 'node:assert';
import {beforeEach, describe as suite, test} from 'node:test';
import path from 'path';
import {fileURLToPath} from 'url';
import {AbsolutePath} from '../../../index.js';
import {
  getSourceFilename,
  InMemoryAnalyzer,
  languages,
  setupAnalyzerForTest,
  setupAnalyzerForTestWithModule,
} from '../utils.js';

for (const lang of languages) {
  suite(`Module tests (${lang})`, () => {
    const {module} = setupAnalyzerForTestWithModule(
      lang,
      'modules',
      'module-a'
    );

    test('Dependencies correctly analyzed', () => {
      const getMonorepoSubpath = (f: string) =>
        f?.slice(f.lastIndexOf('packages' + path.sep));
      const expectedDeps = new Set([
        // This import will either be to a .ts file or a .js file depending on
        // language, since it's in the program
        getSourceFilename(
          `packages/labs/analyzer/test-files/${lang}/modules/module-b`,
          lang
        ),
        // The Lit import will always be a .d.ts file regardless of language since
        // it's outside the program and has declarations
        path.normalize(`packages/lit/index.d.ts`),
      ]);
      assert.equal(expectedDeps.size, module.dependencies.size);
      for (const d of module.dependencies) {
        assert.ok(
          expectedDeps.has(getMonorepoSubpath(d)),
          `${getMonorepoSubpath(d)} not in\n ${Array.from(expectedDeps).join(
            '\n'
          )}`
        );
      }
    });
  });

  suite(`Module caching tests (${lang})`, () => {
    let analyzer: InMemoryAnalyzer;

    beforeEach(() => {
      analyzer = new InMemoryAnalyzer(lang, {
        '/package.json': JSON.stringify({name: '@lit-internal/in-memory-test'}),
      });
    });

    test('getModule returns same model when unchanged, different when changed', () => {
      analyzer.setFile('/module', `export const foo = 'foo';`);
      // Read initial model for module
      const module1 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.equal(module1.declarations.length, 1);
      // Read again with no change
      const module2 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module1 === module2);
      // Change dependency and we expect a different model
      analyzer.setFile('/module', `export class Foo {}; export class Bar {};`);
      const module3 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module2 !== module3);
      assert.equal(module3.declarations.length, 2);
    });

    test('getModule returns same model when direct dependency unchanged, different when changed', () => {
      analyzer.setFile('/dep1', `export class Bar { bar = 1; }`);
      analyzer.setFile(
        '/module',
        `import {Bar} from './dep1.js';
          export class Foo extends Bar {};`
      );
      // Read initial model for module
      const module1 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      // Read again with no change, we expect the cached model to be returned
      const module2 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module1 === module2);
      // Change dependency; we still expect the same model because nothing
      // has caused the dependency model to be created yet
      analyzer.setFile('/dep1', `export class Bar { bar = 2; }`);
      const module3 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module1 === module3);
      // Now cause the dependency model to be created and cached; we still
      // expect the same model since nothing has been invalidated
      const dep1 = analyzer.getModule(
        getSourceFilename('/dep1', lang) as AbsolutePath
      );
      const module4 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module1 === module4);
      // Now change the dependency; since module depends on dep1, and since the
      // dep1 model has been created/cached (and is now invalid), the module's
      // model should be created anew, ensuring it has no stale information
      // cached from dep1
      analyzer.setFile('/dep1', `export class Bar { bar = 2; }`);
      const module5 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module4 !== module5);
      // We should also see that the dependency model is re-created if we ask
      // for it
      const dep2 = analyzer.getModule(
        getSourceFilename('/dep1', lang) as AbsolutePath
      );
      assert.ok(dep1 !== dep2);
    });

    test('getModule returns same model when transitive dependency unchanged, different when changed', () => {
      analyzer.setFile('/dep2', `export class Baz { baz = 1; }`);
      analyzer.setFile(
        '/dep1',
        `import {Baz} from './dep2.js';
          export class Bar extends Baz {}`
      );
      analyzer.setFile(
        '/module',
        `import {Bar} from './dep1.js';
          export class Foo extends Bar {};`
      );
      // Read initial models for module and deps
      const module1 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      analyzer.getModule(getSourceFilename('/dep1', lang) as AbsolutePath);
      analyzer.getModule(getSourceFilename('/dep2', lang) as AbsolutePath);
      // Read again with no change
      const module2 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module1 === module2);
      // Change transitive dependency and we expect a different model
      analyzer.setFile('/dep2', `export class Baz { baz = 2; }`);
      const module3 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module2 !== module3);
    });

    test('getModule returns same model when unrelated file changed', () => {
      analyzer.setFile('/unrelated', `export class Unrelated { n = 1; }`);
      analyzer.setFile('/dep2', `export class Baz { }`);
      analyzer.setFile(
        '/dep1',
        `import {Baz} from './dep2.js';
          export class Bar extends Baz {}`
      );
      analyzer.setFile(
        '/module',
        `import {Bar} from './dep1.js';
          export class Foo extends Bar {};`
      );
      // Read initial models for module and deps
      const module1 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      analyzer.getModule(getSourceFilename('/dep1', lang) as AbsolutePath);
      analyzer.getModule(getSourceFilename('/dep2', lang) as AbsolutePath);
      analyzer.getModule(getSourceFilename('/unrelated', lang) as AbsolutePath);
      // Change unrelated module and we expect the same module
      analyzer.setFile('/unrelated', `export class Unrelated { n = 2; }`);
      const module2 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module1 === module2);
      // Change transitive dependency and we expect a different model
      analyzer.setFile('/dep2', `export class Baz { baz = 2; }`);
      const module3 = analyzer.getModule(
        getSourceFilename('/module', lang) as AbsolutePath
      );
      assert.ok(module2 !== module3);
    });
  });

  suite(`Circular module cache (${lang})`, () => {
    const {analyzer} = setupAnalyzerForTest(lang, 'circular-modules');

    test('getModule processes circular re-exports', async () => {
      const modules = analyzer.getPackage().modules;
      for (const {sourcePath} of modules) {
        const agnosticModuleName = path
          .basename(sourcePath)
          .replace(/\...$/, '');
        const sourceFilename = getSourceFilename(
          path.join(
            fileURLToPath(
              new URL(
                `../../../test-files/${lang}/circular-modules/`,
                import.meta.url
              )
            ),
            agnosticModuleName
          ),
          lang
        ) as AbsolutePath;
        const module = analyzer.getModule(sourceFilename);
        assert.doesNotThrow(() => module.exportNames);
      }
    });
  });

  // Doing module JSDoc tests in-memory, to test a number of variations
  // without needing to maintain a file for each.

  for (const hasFirstStatementDoc of [false, true]) {
    suite(
      `Module jsDoc tests, ${
        hasFirstStatementDoc ? 'has' : 'no'
      } first statement docs (${lang})`,
      () => {
        let analyzer: InMemoryAnalyzer;

        beforeEach(() => {
          analyzer = new InMemoryAnalyzer(lang, {
            '/package.json': JSON.stringify({
              name: '@lit-internal/in-memory-test',
            }),
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

        test('untagged module description with @module tag', () => {
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
          assert.equal(
            module.description,
            'Module description\nmore description'
          );
        });

        test('untagged module description with @fileoverview tag', () => {
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
          assert.equal(
            module.getDeclaration('foo').description,
            hasFirstStatementDoc ? 'First statement description' : undefined
          );
        });

        test('module description in @fileoverview tag', () => {
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
          assert.equal(
            module.description,
            'Module description\nmore description'
          );
          assert.equal(
            module.getDeclaration('foo').description,
            hasFirstStatementDoc ? 'First statement description' : undefined
          );
        });

        test('untagged module description with @packageDocumentation tag', () => {
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
          assert.equal(
            module.getDeclaration('foo').description,
            hasFirstStatementDoc ? 'First statement description' : undefined
          );
        });

        test('module description in @packageDocumentation tag', () => {
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
          assert.equal(
            module.getDeclaration('foo').description,
            hasFirstStatementDoc ? 'First statement description' : undefined
          );
        });

        test('module description in @packageDocumentation tag with other tags', () => {
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
          assert.equal(
            module.getDeclaration('foo').description,
            hasFirstStatementDoc ? 'First statement description' : undefined
          );
        });

        test('untagged module description', () => {
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
          assert.equal(
            module.getDeclaration('foo').description,
            'First statement description'
          );
        });

        test('multiple untagged module descriptions', () => {
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
          assert.equal(
            module.getDeclaration('foo').description,
            'First statement description'
          );
        });

        test('multiple untagged module descriptions with other tags', () => {
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
          assert.equal(
            module.getDeclaration('foo').description,
            'First statement description'
          );
        });
      }
    );
  }
}
