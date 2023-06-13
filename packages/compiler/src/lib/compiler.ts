/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {programFromTsConfig} from './typescript.js';
import {resolve as resolvePath} from 'path';
import {compileLitTemplates} from './template-transform.js';

export const hello = () => 'Hello';

export const compile = (path: string) => {
  const configPath = resolvePath(path);
  const program = programFromTsConfig(configPath);
  for (const file of program.getSourceFiles()) {
    console.log('COMPILING:', file.fileName);
    const emitResult = program.emit(file, undefined, undefined, undefined, {
      before: [compileLitTemplates()],
    });
    console.log(emitResult);
  }
};

export interface Config {
  /**
   * Base directory on disk that contained the config file. Used for resolving
   * paths relative to the config file.
   */
  baseDir: string;

  /**
   * Resolve a filepath relative to the directory that contained the config
   * file.
   */
  resolve: (path: string) => string;
}
