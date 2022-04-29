/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';

const frameworkGenerators = {
  react: () => import('../generate/react.js'),
};

type FrameworkName = keyof typeof frameworkGenerators;

export const run = async (
  {packageRoot, frameworks}: {packageRoot: string; frameworks: string[]},
  console: Console
) => {
  const analyzer = new Analyzer(packageRoot as AbsolutePath);
  const analysis = analyzer.analyzePackage();
  await Promise.all(
    (frameworks as FrameworkName[])
      .map((framework) => {
        const importer = frameworkGenerators[framework];
        if (importer === undefined) {
          throw new Error(`No generator exists for framework '${framework}'`);
        }
        return importer;
      })
      .map(async (importer) => {
        const generator = await importer();
        await generator.run(analysis, console);
      })
  );
};
