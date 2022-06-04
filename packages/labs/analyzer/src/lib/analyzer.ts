/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {
  Package,
  Module,
  ClassDeclaration,
  PackageJson,
  VariableDeclaration,
} from './model.js';
import {ProgramContext} from './program-context.js';
import {AbsolutePath, absoluteToPackage} from './paths.js';
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
  readonly packageJson: PackageJson;
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
    try {
      this.packageJson = JSON.parse(
        fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8')
      );
    } catch (e) {
      throw new Error(`package.json not found in ${packageRoot}`);
    }
    if (this.packageJson.name === undefined) {
      throw new Error(`package.json in ${packageRoot} did not have a name.`);
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
    this.commandLine = ts.parseJsonConfigFileContent(
      configFile.config /* json */,
      ts.sys /* host */,
      packageRoot /* basePath */,
      undefined /* existingOptions */,
      path.relative(packageRoot, configFileName) /* configFileName */
    );

    this.programContext = new ProgramContext(
      this.commandLine,
      this.packageJson
    );
  }

  analyzePackage() {
    const rootFileNames = this.programContext.program.getRootFileNames();

    return new Package({
      rootDir: this.packageRoot,
      modules: rootFileNames.map((fileName) =>
        this.analyzeFile(path.normalize(fileName) as AbsolutePath)
      ),
      tsConfig: this.commandLine,
      packageJson: this.packageJson,
    });
  }

  analyzeFile(fileName: AbsolutePath) {
    const sourceFile = this.programContext.program.getSourceFile(fileName)!;
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
      // The jsPath appears to come out of the ts API with unix
      // separators; since sourcePath uses OS separators, normalize
      // this so that all our model paths are OS-native
      jsPath: absoluteToPackage(
        path.normalize(jsPath) as AbsolutePath,
        this.packageRoot
      ),
      sourceFile,
    });

    this.programContext.currentModule = module;

    for (const statement of sourceFile.statements) {
      if (ts.isClassDeclaration(statement)) {
        if (isLitElement(statement, this.programContext)) {
          module.declarations.push(
            getLitElementDeclaration(statement, this.programContext)
          );
        } else {
          module.declarations.push(
            new ClassDeclaration({
              name: statement.name?.text,
              node: statement,
            })
          );
        }
        // TODO(kschaaf) should we only analyze exported things?
      } else if (ts.isVariableStatement(statement) && isExported(statement)) {
        module.declarations.push(
          ...statement.declarationList.declarations
            .filter((dec) => ts.isIdentifier(dec.name))
            .map(
              (dec) =>
                new VariableDeclaration({
                  name: (dec.name as ts.Identifier).text,
                  node: dec,
                  type: this.programContext.getTypeForNode(dec),
                })
            )
        );
      }
    }
    this.programContext.currentModule = undefined;
    return module;
  }
}

const isExported = (node: ts.Statement): boolean => {
  return (
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false
  );
};
