/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Package} from '@lit-labs/analyzer/lib/model.js';

export const run = async (analysis: Package, console: Console) => {
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
