/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Package, Module} from './model.js';

/**
 * An analyzer for Lit npm packages
 */
export class Analyzer {
  readonly packageRoot: string;
  readonly commandLine: ts.ParsedCommandLine;
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;

  /**
   * @param packageRoot The root directory of the package to analyze. Currently
   * this directory must have a tsconfig.json file.
   */
  constructor(packageRoot: string) {
    this.packageRoot = packageRoot;

    const configFileName = ts.findConfigFile(
      packageRoot,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    if (configFileName === undefined) {
      // TODO: use a hard-coded tsconfig for JS projects.
      throw new Error('tsconfig not found');
    }
    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    this.commandLine = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      packageRoot
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
      throw new Error('Copmiler errors');
    }
    const rootFileNames = this.program.getRootFileNames();
    const modules = [];
    for (const fileName of rootFileNames) {
      modules.push(this.analyzeFile(fileName));
    }
    // TODO: return a package object...
    return new Package(modules);
  }

  analyzeFile(fileName: string) {
    const sourceFile = this.program.getSourceFile(fileName)!;

    return new Module(sourceFile);
  }

  private _isLitElementClassDeclaration = (t: ts.BaseType) => {
    const declarations = t.getSymbol()?.getDeclarations();
    if (declarations?.length !== 1) {
      return false;
    }
    const node = declarations[0];
    return (
      this._isLitElementModule(node.getSourceFile()) &&
      ts.isClassDeclaration(node) &&
      node.name?.getText() === 'LitElement'
    );
  };

  private _isLitElementModule = (file: ts.SourceFile) => {
    return file.fileName.endsWith('/node_modules/lit-element/lit-element.d.ts');
  };

  isLitElement = (node: ts.Node): node is ts.ClassDeclaration => {
    if (!ts.isClassLike(node)) {
      return false;
    }
    const type = this.checker.getTypeAtLocation(node) as ts.InterfaceType;
    const baseTypes = this.checker.getBaseTypes(type);
    for (const t of baseTypes) {
      if (this._isLitElementClassDeclaration(t)) {
        return true;
      }
    }
    return false;
  };
}
