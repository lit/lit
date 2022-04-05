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
export declare class Analyzer {
  readonly packageRoot: string;
  readonly commandLine: ts.ParsedCommandLine;
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  /**
   * @param packageRoot The root directory of the package to analyze. Currently
   * this directory must have a tsconfig.json file.
   */
  constructor(packageRoot: string);
  analyzePackage(): Package;
  analyzeFile(fileName: string): Module;
  private _isLitElementClassDeclaration;
  private _isLitElementModule;
  isLitElement: (node: ts.Node) => node is ts.ClassDeclaration;
}
//# sourceMappingURL=analyzer.d.ts.map
