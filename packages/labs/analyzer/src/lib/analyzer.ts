/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {PackageJson, AnalyzerInterface} from './model.js';
import {AbsolutePath} from './paths.js';
import * as path from 'path';
import {getModule} from './javascript/modules.js';
export {PackageJson};

export interface AnalyzerInit {
  getProgram: () => ts.Program;
  fs: AnalyzerInterface['fs'];
  path: AnalyzerInterface['path'];
}

/**
 * An analyzer for Lit typescript modules. Given an AnalyzerInterface containing
 * a TypeScript program and
 */
export class Analyzer implements AnalyzerInterface {
  private readonly _getProgram: () => ts.Program;
  readonly fs: AnalyzerInterface['fs'];
  readonly path: AnalyzerInterface['path'];
  private _commandLine: ts.ParsedCommandLine | undefined = undefined;

  constructor(init: AnalyzerInit) {
    this._getProgram = init.getProgram;
    this.fs = init.fs;
    this.path = init.path;
  }

  get program() {
    return this._getProgram();
  }

  get commandLine() {
    return (this._commandLine ??= getCommandLineFromProgram(this));
  }

  getModule(modulePath: AbsolutePath) {
    return getModule(
      this.program.getSourceFile(path.normalize(modulePath))!,
      this
    );
  }
}

export const getCommandLineFromProgram = (analyzer: Analyzer) => {
  const compilerOptions = analyzer.program.getCompilerOptions();
  const commandLine = ts.parseJsonConfigFileContent(
    {
      files: analyzer.program.getRootFileNames(),
      compilerOptions,
    },
    ts.sys,
    analyzer.path.basename(compilerOptions.configFilePath as string),
    undefined,
    compilerOptions.configFilePath as string
  );
  return commandLine;
};
