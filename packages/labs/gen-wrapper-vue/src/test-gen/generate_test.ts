/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {test} from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
import * as fs from 'fs';
import * as path from 'path';
import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {
  installPackage,
  buildPackage,
  packPackage,
} from '@lit-labs/gen-utils/lib/package-utils.js';
import {writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {generateVueWrapper} from '../index.js';
import {assertGoldensMatch} from '@lit-internal/tests/utils/assert-goldens.js';

const testProjects = '../test-projects';
const outputFolder = 'gen-output';

const testWrapper =
  (project = '', outputName = '') =>
  async () => {
    const inputPackage = path.resolve(testProjects, project);
    const outputPackage = path.resolve(outputFolder, project + '-vue');

    if (fs.existsSync(outputPackage)) {
      fs.rmSync(outputPackage, {recursive: true});
    }

    const analyzer = new Analyzer(inputPackage as AbsolutePath);
    const analysis = analyzer.analyzePackage();
    await writeFileTree(outputFolder, await generateVueWrapper(analysis));

    const wrapperSourceFile = fs.readFileSync(
      path.join(outputPackage, `src/${outputName}.vue`)
    );
    assert.ok(wrapperSourceFile.length > 0);

    await assertGoldensMatch(outputPackage, path.join('goldens', project), {
      formatGlob: '**/*.{vue,ts,js,json}',
    });

    await installPackage(outputPackage, {
      [`@lit-internal/${project}`]: inputPackage,
      '@lit-labs/vue-utils': '../vue-utils',
    });

    await buildPackage(outputPackage);

    // Pack the generated package here, as `test-output` package.json will
    // reference the generated tarball here by filename; `test-output:installSelf`
    // depends on these tests run by `test:gen`.
    await packPackage(outputPackage);

    // This verifies the package installation and build nominally succeeded. Note
    // that runtime tests of this generated package are run as a separate `npm run
    // test` command in `test-output` using `@web/test-runner`.
    const wrapperJsFile = fs.readFileSync(
      path.join(outputPackage, `${outputName}.js`)
    );
    assert.ok(wrapperJsFile.length > 0);
  };

test('basic wrapper generation', testWrapper('test-element-a', 'ElementA'));
test(
  'events wrapper generation',
  testWrapper('test-element-events', 'ElementEvents')
);
test(
  'slots wrapper generation',
  testWrapper('test-element-slots', 'ElementSlots')
);
// test(
//   'props wrapper generation',
//   testWrapper('test-element-props', 'ElementProps')
// );
// test(
//   'multi wrapper generation',
//   testWrapper('test-element-multi', 'ElementMulti')
// );

test.run();
