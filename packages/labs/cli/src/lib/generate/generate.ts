/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {writeFileTree} from './utils.js';

const frameworkGenerators = {
  react: () => import('../generate/react.js'),
};

type FrameworkName = keyof typeof frameworkGenerators;

export const run = async (
  {
    packages,
    frameworks,
    outDir,
  }: {packages: string[]; frameworks: string[]; outDir: string},
  console: Console
) => {
  for (const packageRoot of packages) {
    const analyzer = new Analyzer(packageRoot as AbsolutePath);
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
    await Promise.allSettled(
      importers.map(async (importer) => {
        const generator = await importer();
        const files = await generator.run(packageRoot, analysis, console);
        await writeFileTree(outDir, files);
      })
    );
  }
};
