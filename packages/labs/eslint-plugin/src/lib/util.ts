/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AbsolutePath, Analyzer} from '@lit-labs/analyzer';
import {
  ESLintUtils,
  ParserServicesWithTypeInformation,
} from '@typescript-eslint/utils';
// TODO (justinfagnani): get from ESLintUtils if possible?
// See q: https://discord.com/channels/1026804805894672454/1084238921677946992/1199174067459198986
import ts from 'typescript';
import * as path from 'path';

export const createRule = ESLintUtils.RuleCreator(
  // TODO (justinfagnani): set up rule doc publishing pipeline for lit.dev
  (name: string) => `https://lit.dev/eslint-plugin/${name}`
);

const analyzerByProgram = new WeakMap<ts.Program, Analyzer>();

export const getAnalyzer = (services: ParserServicesWithTypeInformation) => {
  const program = services.program;
  let analyzer = analyzerByProgram.get(program);
  if (analyzer === undefined) {
    analyzer = new Analyzer({
      typescript: ts,
      getProgram: () => program,
      fs: ts.sys,
      path,
    });
  }
  return analyzer;
};

export const getDeclarationForNode = (
  analyzer: Analyzer,
  filename: string,
  node: ts.Node
) => {
  const modulePath = analyzer.fs.useCaseSensitiveFileNames
    ? filename
    : filename.toLocaleLowerCase();
  const module = analyzer.getModule(modulePath as AbsolutePath);
  for (const declaration of module.declarations) {
    if (declaration.node === node) {
      return declaration;
    }
  }
  return undefined;
};

export const isTrueLiteral = (e: ts.Expression): e is ts.TrueLiteral =>
  e.kind === ts.SyntaxKind.TrueKeyword;

export const isFalseLiteral = (e: ts.Expression): e is ts.FalseLiteral =>
  e.kind === ts.SyntaxKind.FalseKeyword;

// TODO (justinfagnani): add a type predicate?
// When is `undefined` ever not an identifier?
export const isUndefinedLiteral = (e: ts.Expression) =>
  (ts.isIdentifier(e) && e.text === 'undefined') ||
  e.kind === ts.SyntaxKind.UndefinedKeyword;
