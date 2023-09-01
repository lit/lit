/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing LitElement (and ReactiveElement) declarations.
 */

import type ts from 'typescript';
import {getClassMembers, getHeritage} from '../javascript/classes.js';
import {
  LitElementDeclaration,
  AnalyzerInterface,
  CustomElementField,
  ReactiveProperty,
} from '../model.js';
import {
  CustomElementDecorator,
  isCustomElementDecorator,
} from './decorators.js';
import {getProperties} from './properties.js';
import {
  getJSDocData,
  getTagName as getCustomElementTagName,
} from '../custom-elements/custom-elements.js';

export type TypeScript = typeof ts;

/**
 * Gets an analyzer LitElementDeclaration object from a ts.ClassDeclaration
 * (branded as LitClassDeclaration).
 */
export const getLitElementDeclaration = (
  declaration: LitClassDeclaration,
  analyzer: AnalyzerInterface
): LitElementDeclaration => {
  const reactiveProperties = getProperties(declaration, analyzer);
  return new LitElementDeclaration({
    tagname: getTagName(analyzer.typescript, declaration),
    // TODO(kschaaf): support anonymous class expressions when assigned to a const
    name: declaration.name?.text ?? '',
    node: declaration,
    reactiveProperties,
    ...getJSDocData(declaration, analyzer),
    getHeritage: () => getHeritage(declaration, analyzer),
    ...getLitElementClassMembers(declaration, analyzer, reactiveProperties),
  });
};

const getLitElementClassMembers = (
  declaration: LitClassDeclaration,
  analyzer: AnalyzerInterface,
  reactiveProperties: Map<string, ReactiveProperty>
) => {
  const info = getClassMembers(declaration, analyzer);
  for (const [name, prop] of reactiveProperties) {
    const field = info.fieldMap.get(name);
    if (field instanceof CustomElementField) {
      field.attribute =
        prop?.attribute === false
          ? undefined
          : typeof prop?.attribute === 'string'
          ? prop.attribute
          : name.toLowerCase();
      field.reflects = prop?.reflect ?? undefined;
    }
  }
  return info;
};

/**
 * Returns true if this type represents the actual LitElement class.
 */
const _isLitElementClassDeclaration = (
  t: ts.BaseType,
  analyzer: AnalyzerInterface
) => {
  // TODO: should we memoize this for performance?
  const declarations = t.getSymbol()?.getDeclarations();
  if (declarations?.length !== 1) {
    return false;
  }
  const node = declarations[0];
  return (
    _isLitElement(analyzer.typescript, node) ||
    isLitElementSubclass(node, analyzer)
  );
};

/**
 * Returns true if the given declaration is THE LitElement declaration.
 *
 * TODO(kschaaf): consider a less brittle method of detecting canonical
 * LitElement
 */
const _isLitElement = (ts: TypeScript, node: ts.Declaration) => {
  return (
    _isLitElementModule(node.getSourceFile()) &&
    ts.isClassDeclaration(node) &&
    node.name?.text === 'LitElement'
  );
};

/**
 * Returns true if the given source file is THE lit-element source file.
 */
const _isLitElementModule = (file: ts.SourceFile) => {
  return (
    file.fileName.endsWith('/node_modules/lit-element/lit-element.d.ts') ||
    // Handle case of running analyzer in symlinked monorepo
    file.fileName.endsWith('/packages/lit-element/lit-element.d.ts')
  );
};

/**
 * This type identifies a ClassDeclaration as one that inherits from LitElement.
 *
 * It lets isLitElement function as a type predicate that returns whether or
 * not its argument is a LitElement such that when it returns false TypeScript
 * doesn't infer that the argument is not a ClassDeclaration.
 */
export type LitClassDeclaration = ts.ClassDeclaration & {
  __litBrand: never;
};

/**
 * Returns true if `node` is a ClassLikeDeclaration that extends LitElement.
 */
export const isLitElementSubclass = (
  node: ts.Node,
  analyzer: AnalyzerInterface
): node is LitClassDeclaration => {
  if (!analyzer.typescript.isClassLike(node)) {
    return false;
  }
  const checker = analyzer.program.getTypeChecker();
  const type = checker.getTypeAtLocation(node) as ts.InterfaceType;
  const baseTypes = checker.getBaseTypes(type);
  for (const t of baseTypes) {
    if (_isLitElementClassDeclaration(t, analyzer)) {
      return true;
    }
  }
  return false;
};

/**
 * Returns the tagname associated with a LitClassDeclaration
 * @param declaration
 * @returns
 */
export const getTagName = (
  ts: TypeScript,
  declaration: LitClassDeclaration
) => {
  const customElementDecorator = ts
    .getDecorators(declaration)
    ?.find((d): d is CustomElementDecorator => isCustomElementDecorator(ts, d));
  if (
    customElementDecorator !== undefined &&
    customElementDecorator.expression.arguments.length === 1 &&
    ts.isStringLiteral(customElementDecorator.expression.arguments[0])
  ) {
    // Get tag from decorator: `@customElement('x-foo')`
    return customElementDecorator.expression.arguments[0].text;
  }
  return getCustomElementTagName(declaration);
};
