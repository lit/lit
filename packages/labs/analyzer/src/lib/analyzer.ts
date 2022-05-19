/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Package, Module, ClassDeclaration, PackageJson} from './model.js';
import {AbsolutePath, absoluteToPackage, PackagePath} from './paths.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from './lit-element/lit-element.js';
import * as fs from 'fs';
import * as path from 'path';
export {PackageJson};

/**
 * An analyzer for Lit npm packages
 */
export class Analyzer {
  readonly packageRoot: AbsolutePath;
  readonly commandLine: ts.ParsedCommandLine;
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  readonly packageJson: PackageJson;

  /**
   * @param packageRoot The root directory of the package to analyze. Currently
   * this directory must have a tsconfig.json and package.json.
   */
  constructor(packageRoot: AbsolutePath) {
    this.packageRoot = packageRoot;

    // TODO(kschaaf): Consider moving the package.json and tsconfig.json
    // to analyzePackage() or move it to an async factory function that
    // passes these to the constructor as arguments.
    try {
      this.packageJson = JSON.parse(
        fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
      );
    } catch (e) {
      throw new Error(`package.json not found in ${packageRoot}`);
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
    // Note that passing `packageRoot` for `basePath` works, but
    // `getOutputFileNames` will fail without passing `configFileName`; once you
    // pass that, it looks like paths are relative to the `configFileName`
    // location (which is also under `packageRoot`), in which case `basePath`
    // shouldn't duplicate `packageRoot`
    this.commandLine = ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      ts.sys /* host */,
      './' /* basePath */,
      undefined /* existingOptions */,
      configFileName /* configFileName */
    );
    this.program = ts.createProgram(
      this.commandLine.fileNames,
      this.commandLine.options
    );
    this.checker = this.program.getTypeChecker();
  }

  analyzePackage() {
    const diagnostics = this.program.getSemanticDiagnostics();
    if (diagnostics.length > 0) {
      console.error('Please fix errors first');
      console.error(diagnostics);
      throw new Error('Compiler errors');
    }
    const rootFileNames = this.program.getRootFileNames();

    const modules = [];
    for (const fileName of rootFileNames) {
      modules.push(this.analyzeFile(fileName as AbsolutePath));
    }
    return new Package({
      rootDir: this.packageRoot,
      modules,
      tsConfig: this.commandLine,
      packageJson: this.packageJson,
    });
  }

  analyzeFile(fileName: AbsolutePath) {
    const sourceFile = this.program.getSourceFile(fileName)!;
    const sourcePath = absoluteToPackage(fileName, this.packageRoot);
    const fullSourcePath = path.join(this.packageRoot, sourcePath);
    const jsPath = ts
      .getOutputFileNames(this.commandLine, fullSourcePath, false)
      .filter((f) => f.endsWith('.js'))[0];
    // TODO(kschaaf): this could happen if someone imported only a .d.ts file;
    // we might need to handle this differently
    if (jsPath === undefined) {
      throw new Error(
        `Could not determine output filename for '${sourcePath}'`
      );
    }

    const module = new Module({
      sourcePath,
      jsPath: jsPath as PackagePath,
      sourceFile,
    });

    for (const statement of sourceFile.statements) {
      if (ts.isClassDeclaration(statement)) {
        if (isLitElement(statement, this.checker)) {
          module.declarations.push(
            getLitElementDeclaration(statement, this.checker)
          );
        } else {
          module.declarations.push(
            new ClassDeclaration({
              name: statement.name?.text,
              node: statement,
            })
          );
        }
      }
    }
    return module;
  }
}
