/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Analyzer} from '@lit-labs/analyzer';
import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';

export const run = async (packageRoot: AbsolutePath, console: Console) => {
  const analyzer = new Analyzer(packageRoot);
  const analysis = analyzer.analyzePackage();
  await Promise.all(
    analysis.modules.map(async (module) => {
      // For now, log files containing declarations
      const elements = module.declarations;
      if (elements.length > 0) {
        console.log(module.sourceFile.fileName);
      }
    })
  );
};
