/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import * as path from 'path';
import {KnownError} from './error.js';

/**
 * Set up a TypeScript API program given a tsconfig.json filepath.
 */
export function programFromTsConfig(tsConfigPath: string): ts.Program {
  const {config, error} = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    // TODO(aomarks) Set up proper TypeScript diagnostics reporting here too.
    throw new KnownError(JSON.stringify(error));
  }
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(tsConfigPath)
  );
  if (parsedCommandLine.errors.length > 0) {
    throw new KnownError(
      parsedCommandLine.errors.map((error) => JSON.stringify(error)).join('\n')
    );
  }
  const {fileNames, options} = parsedCommandLine;
  const program = ts.createProgram(fileNames, options);
  return program;
}
