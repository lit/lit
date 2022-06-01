/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with LitElement (and ReactiveElement) declarations.
 */

import ts from 'typescript';
import {LitElementDeclaration, ProgramContext} from '../model.js';
import {isCustomElementDecorator} from './decorators.js';
import {getEvents} from './events.js';
import {getProperties} from './properties.js';

/**
 * Gets an analyzer LitElementDeclaration object from a ts.ClassDeclaration
 * (branded as LitClassDeclaration).
 */
export const getLitElementDeclaration = (
  node: LitClassDeclaration,
  programContext: ProgramContext
): LitElementDeclaration => {
  return new LitElementDeclaration({
    tagname: getTagName(node),
    name: node.name?.text,
    node,
    reactiveProperties: getProperties(node, programContext),
    events: getEvents(node, programContext),
  });
};

/**
 * Returns true if this type represents the actual LitElement class.
 */
const _isLitElementClassDeclaration = (t: ts.BaseType) => {
  // TODO: should we memoize this for performance?
  const declarations = t.getSymbol()?.getDeclarations();
  if (declarations?.length !== 1) {
    return false;
  }
  const node = declarations[0];
  return (
    _isLitElementModule(node.getSourceFile()) &&
    ts.isClassDeclaration(node) &&
    node.name?.text === 'LitElement'
  );
};

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
export const isLitElement = (
  node: ts.Node,
  programContext: ProgramContext
): node is LitClassDeclaration => {
  if (!ts.isClassLike(node)) {
    return false;
  }
  const type = programContext.checker.getTypeAtLocation(
    node
  ) as ts.InterfaceType;
  const baseTypes = programContext.checker.getBaseTypes(type);
  for (const t of baseTypes) {
    if (_isLitElementClassDeclaration(t)) {
      return true;
    }
  }
  return false;
};

/**
 * Returns the tagname associated with a
 * @param declaration
 * @returns
 */
export const getTagName = (declaration: LitClassDeclaration) => {
  // TODO (justinfagnani): support customElements.define()
  let tagname: string | undefined = undefined;
  const customElementDecorator = declaration.decorators?.find(
    isCustomElementDecorator
  );
  if (
    customElementDecorator !== undefined &&
    customElementDecorator.expression.arguments.length === 1 &&
    ts.isStringLiteral(customElementDecorator.expression.arguments[0])
  ) {
    tagname = customElementDecorator.expression.arguments[0].text;
  }
  return tagname;
};
