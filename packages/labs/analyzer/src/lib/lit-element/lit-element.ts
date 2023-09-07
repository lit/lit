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
  ClassField,
} from '../model.js';
import {
  CustomElementDecorator,
  isCustomElementDecorator,
} from './decorators.js';
import {getProperties} from './properties.js';
import {
  getJSDocData,
  getTagName as getCustomElementTagName,
  getCustomElementFieldMapByAttribute,
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
  const members = getLitElementClassMembers(
    declaration,
    analyzer,
    reactiveProperties
  );
  return new LitElementDeclaration({
    tagname: getTagName(analyzer.typescript, declaration),
    // TODO(kschaaf): support anonymous class expressions when assigned to a const
    name: declaration.name?.text ?? '',
    node: declaration,
    reactiveProperties,
    ...getJSDocData(
      declaration,
      analyzer,
      getCustomElementFieldMapByAttribute(members)
    ),
    getHeritage: () => getHeritage(declaration, analyzer),
    ...members,
  });
};

const attributeNameForReactiveProperty = (prop: ReactiveProperty) =>
  prop?.attribute === false
    ? undefined
    : typeof prop?.attribute === 'string'
    ? prop.attribute
    : prop.name.toLowerCase();

const getCustomElementFieldFromClassField = (
  field: ClassField,
  prop: ReactiveProperty
) =>
  new CustomElementField({
    name: field.name,
    attribute: attributeNameForReactiveProperty(prop),
    reflects: prop.reflect ?? undefined,
    static: field.static,
    privacy: field.privacy,
    summary: field.summary,
    description: field.description,
    deprecated: field.deprecated,
    default: field.default,
    readonly: field.readonly,
    inheritedFrom: field.inheritedFrom,
    source: field.source,
    type: field.type,
  });

const getCustomElementFieldFromReactiveProp = (prop: ReactiveProperty) =>
  new CustomElementField({
    name: prop.name,
    attribute: attributeNameForReactiveProperty(prop),
    reflects: prop.reflect ?? undefined,
    privacy: 'public',
    summary: prop.summary,
    description: prop.description,
    deprecated: prop.deprecated,
    default: prop.default,
    type: prop.type,
  });

const getLitElementClassMembers = (
  declaration: LitClassDeclaration,
  analyzer: AnalyzerInterface,
  reactiveProperties: Map<string, ReactiveProperty>
) => {
  const info = getClassMembers(declaration, analyzer);
  for (const [name, prop] of reactiveProperties) {
    info.fieldMap.set(
      name,
      info.fieldMap.has(name)
        ? // if the reactive property is already a ClassField,
          // this will narrow it's type to CustomElementField
          getCustomElementFieldFromClassField(info.fieldMap.get(name)!, prop)
        : // users can define a reactive property in a static properties block
          // but fail to also define a corresponding class field. although this is
          // bad practice on the user's part, the property thus defined will
          // nonetheless function as a class field at runtime, so we add it to the
          // field map here
          getCustomElementFieldFromReactiveProp(prop)
    );
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
