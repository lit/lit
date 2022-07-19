/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Package, PackageJson} from './model.js';
import {ProgramContext} from './program-context.js';
import {AbsolutePath} from './paths.js';
import * as fs from 'fs';
import * as path from 'path';
import {getModule} from './javascript/modules.js';
export {PackageJson};

/**
 * An analyzer for Lit npm packages
 */
export class Analyzer {
  readonly packageRoot: AbsolutePath;
  readonly programContext: ProgramContext;

  /**
   * @param packageRoot The root directory of the package to analyze. Currently
   * this directory must have a tsconfig.json and package.json.
   */
  constructor(packageRoot: AbsolutePath) {
    this.packageRoot = packageRoot;

    // TODO(kschaaf): Consider moving the package.json and tsconfig.json
    // to analyzePackage() or move it to an async factory function that
    // passes these to the constructor as arguments.
    const packageJsonFilename = path.join(packageRoot, 'package.json');
    let packageJsonText;
    try {
      packageJsonText = fs.readFileSync(packageJsonFilename, 'utf8');
    } catch (e) {
      throw new Error(`package.json not found at ${packageJsonFilename}`);
    }
    let packageJson;
    try {
      packageJson = JSON.parse(packageJsonText);
    } catch (e) {
      throw new Error(`Malformed package.json found at ${packageJsonFilename}`);
    }
    if (packageJson.name === undefined) {
      throw new Error(
        `package.json in ${packageJsonFilename} did not have a name.`
      );
    }

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

    this.programContext = new ProgramContext(
      packageRoot,
      commandLine,
      packageJson
    );
  }

  analyzePackage() {
    const rootFileNames = this.programContext.program.getRootFileNames();

    return new Package({
      rootDir: this.packageRoot,
      modules: rootFileNames.map((fileName) =>
        getModule(
          this.programContext.program.getSourceFile(path.normalize(fileName))!,
          this.programContext
        )
      ),
      tsConfig: this.programContext.commandLine,
      packageJson: this.programContext.packageJson,
    });
  }
}
