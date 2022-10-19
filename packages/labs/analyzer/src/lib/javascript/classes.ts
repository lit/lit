/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing class declarations
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {
  ClassDeclaration,
  AnalyzerInterface,
  DeclarationInfo,
} from '../model.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';
import {isExport} from '../references.js';

/**
 * Returns an analyzer `ClassDeclaration` model for the given
 * ts.ClassDeclaration.
 */
const getClassDeclaration = (
  declaration: ts.ClassDeclaration,
  analyzer: AnalyzerInterface
) => {
  if (isLitElement(declaration, analyzer)) {
    return getLitElementDeclaration(declaration, analyzer);
  }
  return new ClassDeclaration({
    // TODO(kschaaf): support anonymous class expressions when assigned to a const
    name: declaration.name?.text ?? '',
    node: declaration,
  });
};

/**
 * Returns the name of a class declaration.
 */
const getClassDeclarationName = (declaration: ts.ClassDeclaration) => {
  const name =
    declaration.name?.text ??
    (declaration.modifiers?.some((s) => s.kind === ts.SyntaxKind.DefaultKeyword)
      ? 'default'
      : undefined);
  if (name === undefined) {
    throw new DiagnosticsError(
      declaration,
      'Unexpected class declaration without a name'
    );
  }
  return name;
};

/**
 * Returns name and model factory for a class declaration.
 */
export const getClassDeclarationInfo = (
  declaration: ts.ClassDeclaration,
  analyzer: AnalyzerInterface
): DeclarationInfo => {
  return {
    name: getClassDeclarationName(declaration),
    factory: () => getClassDeclaration(declaration, analyzer),
    isExport: isExport(declaration),
  };
};
