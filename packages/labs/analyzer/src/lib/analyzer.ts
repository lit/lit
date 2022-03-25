/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {Package, Module} from './model.js';

export class Analyzer {
  packageRoot: string;
  commandLine: ts.ParsedCommandLine;
  program: ts.Program;
  checker: ts.TypeChecker;

  private _litElementClassDeclaration: ts.ClassDeclaration;

  constructor(packageRoot: string) {
    this.packageRoot = packageRoot;

    const configFileName = ts.findConfigFile(
      packageRoot,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    if (configFileName === undefined) {
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
    this._litElementClassDeclaration = this.getLitElementClassDeclaration();
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

  getLitElementClassDeclaration = () => {
    const litElementModule = this.getLitElementModule();
    for (const c of litElementModule.statements) {
      if (ts.isClassDeclaration(c) && c.name?.getText() === 'LitElement') {
        return c;
      }
    }
    throw new Error('LitElement not found');
  };

  getLitElementModule = () => {
    const files = this.program.getSourceFiles();
    for (const file of files) {
      if (
        file.fileName.endsWith('/node_modules/lit-element/lit-element.d.ts')
      ) {
        // hopefully there's only one of these...
        return file;
      }
    }
    throw new Error('lit-element.d.ts not found');
  };

  isLitElement = (node: ts.Node): node is ts.ClassDeclaration => {
    if (!ts.isClassLike(node)) {
      return false;
    }
    const litElementType = this.checker.getTypeAtLocation(
      this._litElementClassDeclaration
    );
    const type = this.checker.getTypeAtLocation(node) as ts.InterfaceType;
    const baseTypes = this.checker.getBaseTypes(type);
    for (const t of baseTypes) {
      if (t === litElementType) {
        return true;
      }
    }
    return false;
  };
}
