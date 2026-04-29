/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as url from 'url';
import * as path from 'path';
import ts from 'typescript';
import {compileLitTemplates} from '@lit-labs/compiler';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * Set up a TypeScript API program given a tsconfig.json filepath.
 */
function programFromTsConfig(tsConfigPath: string): ts.Program {
  const {config, error} = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (error) {
    throw new Error(JSON.stringify(error));
  }
  const parsedConfig = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(tsConfigPath)
  );
  if (parsedConfig.errors.length > 0) {
    throw new Error(
      parsedConfig.errors.map((error) => JSON.stringify(error)).join('\n')
    );
  }
  const {fileNames, options} = parsedConfig;
  const program = ts.createProgram(fileNames, options);
  return program;
}

/**
 * This is a workaround while the compiler is housed in both the Lit 2 and Lit 3
 * branch, and allows the lit-html tests to be built and run while multiple
 * versions of TypeScript exist.
 *
 * Essentially compile only the lit-html test directory with the
 * @lit-labs/compiler TypeScript transformer applied.
 */
function compile(tsconfigPath: string) {
  const configPath = path.resolve(tsconfigPath);
  const program = programFromTsConfig(configPath);
  for (const file of program.getSourceFiles()) {
    program.emit(file, undefined, undefined, undefined, {
      before: [compileLitTemplates()],
    });
  }
}

compile(path.join(__dirname, '../../../lit-html/tsconfig.compiled-tests.json'));
