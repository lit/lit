/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Package, PackageJson, AnalyzerContext} from './model.js';
import {AbsolutePath} from './paths.js';
import * as path from 'path';
import {getModule} from './javascript/modules.js';
import {DiagnosticsError} from './errors.js';
export {PackageJson};

/**
 * An analyzer for Lit npm packages
 */
export class Analyzer {
  readonly packageRoot: AbsolutePath;
  readonly context: AnalyzerContext;

  /**
   * @param packageRoot The root directory of the package to analyze. Currently
   * this directory must have a tsconfig.json and package.json.
   */
  constructor(packageRoot: AbsolutePath) {
    this.packageRoot = packageRoot;

    const configFileName = ts.findConfigFile(
      packageRoot,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    if (configFileName === undefined) {
      // TODO: use a hard-coded tsconfig for JS projects.
      throw new Error(`tsconfig.json not found in ${packageRoot}`);
    }
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    // Note `configFileName` is optional but must be set for
    // `getOutputFileNames` to work correctly; however, it must be relative to
    // `packageRoot`
    const commandLine = ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      ts.sys /* host */,
      packageRoot /* basePath */,
      undefined /* existingOptions */,
      path.relative(packageRoot, configFileName) /* configFileName */
    );

    const program = ts.createProgram(
      commandLine.fileNames,
      commandLine.options
    );
    this.context = {
      commandLine,
      program,
      checker: program.getTypeChecker(),
      path,
      fs: ts.sys,
      log: (s) => console.log(s),
    };
    const diagnostics = this.context.program.getSemanticDiagnostics();
    if (diagnostics.length > 0) {
      throw new DiagnosticsError(
        diagnostics,
        `Error analyzing package '${this.packageRoot}': Please fix errors first`
      );
    }
  }

  analyzePackage() {
    const rootFileNames = this.context.program.getRootFileNames();

    return new Package({
      rootDir: this.packageRoot,
      modules: rootFileNames.map((fileName) =>
        getModule(
          this.context.program.getSourceFile(path.normalize(fileName))!,
          this.context
        )
      ),
    });
  }
}
