/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import * as path from 'path';

const frameworkGenerators = {
  react: async () =>
    (await import('@lit-labs/gen-wrapper-react/index.js')).generateReactWrapper,
};

type FrameworkName = keyof typeof frameworkGenerators;

export const run = async (
  {
    packages,
    frameworks,
    outDir,
  }: {packages: string[]; frameworks: string[]; outDir: string},
  _console: Console
) => {
  for (const packageRoot of packages) {
    // Ensure separators in input paths are normalized and resolved to absolute
    const root = path.normalize(path.resolve(packageRoot)) as AbsolutePath;
    const out = path.normalize(path.resolve(outDir)) as AbsolutePath;
    const analyzer = new Analyzer(root);
    const analysis = analyzer.analyzePackage();
    if (!analysis.packageJson.name) {
      throw new Error(
        `Package at '${packageRoot}' did not have a name in package.json. The 'gen' command requires that packages have a name.`
      );
    }
    const importers = (frameworks as FrameworkName[]).map((framework) => {
      const importer = frameworkGenerators[framework];
      if (importer === undefined) {
        throw new Error(`No generator exists for framework '${framework}'`);
      }
      return importer;
    });
    const results = await Promise.allSettled(
      importers.map(async (importer) => {
        const generator = await importer();
        // TODO(kschaaf): Add try/catches around each of these operations and
        // throw more contextural errors
        await writeFileTree(out, await generator(analysis));
      })
    );
    // `allSettled` will swallow errors, so we need to filter them out of
    // the results and throw a new error up the stack describing all the errors
    // that happened
    const errors = results
      .map((r, i) =>
        r.status === 'rejected'
          ? `Error generating '${frameworks[i]}' wrapper for package '${packageRoot}': ` +
            r.reason
          : ''
      )
      .filter((e) => e)
      .join('\n');
    if (errors.length > 0) {
      throw new Error(errors);
    }
  }
};
