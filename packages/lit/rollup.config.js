/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {litProdConfig} from '../../rollup-common.js';
import {createRequire} from 'module';
import * as path from 'path';

/**
 * Takes a `relativeSourcePath` and `sourcemapPath` - with the same semantics as
 * those provided to the function given to Rollup's
 * [`output.sourcemapPathTransform` config option][1] - and produces a relative
 * path to the source file from the `packages` directory of this repo.
 *
 * [1]: https://rollupjs.org/guide/en/#outputsourcemappathtransform
 */
const makeRelativeToPackagesDir = (relativeSourcePath, sourcemapPath) => {
  const absoluteSourcePath = path.resolve(
    path.join(path.dirname(sourcemapPath), relativeSourcePath)
  );
  const absolutePackagesDirPath = path.resolve(path.join(__dirname, '..'));
  const relativePackagesDirToSourcePath = path.relative(
    absolutePackagesDirPath,
    absoluteSourcePath
  );
  return relativePackagesDirToSourcePath;
};

export default litProdConfig({
  packageName: createRequire(import.meta.url)('./package.json').name,
  entryPoints: [
    'decorators',
    'decorators/custom-element',
    'decorators/event-options',
    'decorators/property',
    'decorators/query',
    'decorators/query-all',
    'decorators/query-assigned-elements',
    'decorators/query-assigned-nodes',
    'decorators/query-async',
    'decorators/state',
    'directive-helpers',
    'directive',
    'directives/async-append',
    'directives/async-replace',
    'directives/cache',
    'directives/choose',
    'directives/class-map',
    'directives/guard',
    'directives/if-defined',
    'directives/join',
    'directives/keyed',
    'directives/live',
    'directives/map',
    'directives/range',
    'directives/ref',
    'directives/repeat',
    'directives/style-map',
    'directives/template-content',
    'directives/unsafe-html',
    'directives/unsafe-svg',
    'directives/until',
    'directives/when',
    'async-directive',
    'html',
    'index',
    'static-html',
  ],
  external: ['lit-element', 'lit-html', '@lit/reactive-element'],
  bundled: [
    {
      file: 'polyfill-support',
    },
    {
      file: 'index',
      output: 'lit-core.min',
      format: 'es',
      sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
        // Convert the paths of the sources to appear as descendants of a
        // directory with the same name as the bundle. (By default, the paths in
        // the source map are relative paths from the bundle to the included
        // sources as they were on disk at the time the bundle was generated.
        // This causes the developer tools to display the original sources at
        // seemingly unrelated locations.)
        return path.join(
          'lit-core.min.js',
          makeRelativeToPackagesDir(relativeSourcePath, sourcemapPath)
        );
      },
    },
    {
      file: 'index.all',
      output: 'lit-all.min',
      format: 'es',
      sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
        // See the comment in the core bundle above.
        return path.join(
          'lit-all.min.js',
          makeRelativeToPackagesDir(relativeSourcePath, sourcemapPath)
        );
      },
    },
  ],
});
