/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {programFromTsConfig} from './typescript.js';
import {resolve as resolvePath} from 'path';
import {compileLitTemplates} from './template-transform.js';

/**
 * @param path Path to a tsconfig
 */
export const compile = (path: string) => {
  const configPath = resolvePath(path);
  const program = programFromTsConfig(configPath);
  for (const file of program.getSourceFiles()) {
    program.emit(file, undefined, undefined, undefined, {
      before: [compileLitTemplates()],
    });
  }
};
