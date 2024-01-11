/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {suite} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import path from 'path';
import {
  AnalyzerModuleTestContext,
  AnalyzerTestContext,
  getSourceFilename,
  InMemoryAnalyzer,
  languages,
  setupAnalyzerForTest,
  setupAnalyzerForTestWithModule,
} from '../utils.js';

import {AbsolutePath} from '../../../index.js';
import {fileURLToPath} from 'url';

for (const lang of languages) {
  const test = suite<AnalyzerModuleTestContext>(`Module tests (${lang})`);

  test.before((ctx) => {
    setupAnalyzerForTestWithModule(ctx, lang, 'modules', 'module-a');
  });

  test('Dependencies correctly analyzed', ({module}) => {
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

  test.run();

  const cachingTest = suite<{
    analyzer: InMemoryAnalyzer;
  }>(`Module caching tests (${lang})`);

  cachingTest.before.each((ctx) => {
    ctx.analyzer = new InMemoryAnalyzer(lang, {
      '/package.json': JSON.stringify({name: '@lit-internal/in-memory-test'}),
    });
  });

  cachingTest(
    'getModule returns same model when unchanged, different when changed',
    ({analyzer}) => {
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
    }
  );

  cachingTest(
    'getModule returns same model when direct dependency unchanged, different when changed',
    ({analyzer}) => {
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
    }
  );

  cachingTest(
    'getModule returns same model when transitive dependency unchanged, different when changed',
    ({analyzer}) => {
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
    }
  );

  cachingTest(
    'getModule returns same model when unrelated file changed',
    ({analyzer}) => {
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
    }
  );

  cachingTest.run();

  const circularTest = suite<AnalyzerTestContext>(
    `Circular module cache (${lang})`
  );
  circularTest.before((ctx) => {
    setupAnalyzerForTest(ctx, lang, 'circular-modules');
  });

  circularTest(
    'getModule processes circular re-exports',
    async ({analyzer}) => {
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
        assert.not.throws(() => module.exportNames);
      }
    }
  );

  circularTest.run();

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
        assert.equal(
          module.getDeclaration('foo').description,
          hasFirstStatementDoc ? 'First statement description' : undefined
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
      assert.equal(
        module.getDeclaration('foo').description,
        hasFirstStatementDoc ? 'First statement description' : undefined
      );
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
        assert.equal(
          module.getDeclaration('foo').description,
          hasFirstStatementDoc ? 'First statement description' : undefined
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
        assert.equal(
          module.getDeclaration('foo').description,
          hasFirstStatementDoc ? 'First statement description' : undefined
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
        assert.equal(
          module.getDeclaration('foo').description,
          hasFirstStatementDoc ? 'First statement description' : undefined
        );
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
      assert.equal(
        module.getDeclaration('foo').description,
        'First statement description'
      );
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
      assert.equal(
        module.getDeclaration('foo').description,
        'First statement description'
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
        assert.equal(
          module.getDeclaration('foo').description,
          'First statement description'
        );
      }
    );

    moduleTest.run();
  }
}
