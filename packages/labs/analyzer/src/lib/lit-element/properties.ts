/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with reactive property declarations
 */

import ts from 'typescript';
import {LitClassDeclaration} from './lit-element.js';
import {ReactiveProperty, Analyzer} from '../model.js';
import {getPropertyDecorator, getPropertyOptions} from './decorators.js';

export const getProperties = (
  node: LitClassDeclaration,
  analyzer: Analyzer
) => {
  const reactiveProperties = new Map<string, ReactiveProperty>();

  const propertyDeclarations = node.members.filter((m) =>
    ts.isPropertyDeclaration(m)
  ) as unknown as ts.NodeArray<ts.PropertyDeclaration>;
  for (const prop of propertyDeclarations) {
    if (!ts.isIdentifier(prop.name)) {
      // TODO(justinfagnani): emit error instead
      throw new Error('unsupported property name');
    }
    const name = prop.name.text;

    const propertyDecorator = getPropertyDecorator(prop);
    if (propertyDecorator !== undefined) {
      const options = getPropertyOptions(propertyDecorator);
      reactiveProperties.set(
        name,
        new ReactiveProperty({
          name,
          getType: () => analyzer.getTypeForNode(prop),
          node: prop,
          attribute: getPropertyAttribute(options, name),
          typeOption: getPropertyType(options),
          reflect: getPropertyReflect(options),
          converter: getPropertyConverter(options),
        })
      );
    }
  }
  return reactiveProperties;
};

/**
 * Gets the `attribute` property of a property options object as a string.
 */
export const getPropertyAttribute = (
  obj: ts.ObjectLiteralExpression | undefined,
  propName: string
) => {
  if (obj === undefined) {
    return propName.toLowerCase();
  }
  const attributeProperty = getObjectProperty(obj, 'attribute');
  if (attributeProperty === undefined) {
    return propName.toLowerCase();
  }
  const {initializer} = attributeProperty;
  if (ts.isStringLiteral(initializer)) {
    return initializer.text;
  }
  if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
    return undefined;
  }
  if (
    initializer.kind === ts.SyntaxKind.TrueKeyword ||
    (ts.isIdentifier(initializer) && initializer.text === 'undefined') ||
    initializer.kind === ts.SyntaxKind.UndefinedKeyword
  ) {
    return propName.toLowerCase();
  }
  return undefined;
};

/**
 * Gets the `type` property of a property options object as a string.
 *
 * Note: A string is returned as a convenience so we don't have to compare
 * the type value against a known set of TS references for String, Number, etc.
 *
 * If a non-default converter is used, the types might not mean the same thing,
 * but we might not be able to realistically support custom converters.
 */
export const getPropertyType = (
  obj: ts.ObjectLiteralExpression | undefined
) => {
  if (obj === undefined) {
    return undefined;
  }
  const typeProperty = getObjectProperty(obj, 'type');
  if (typeProperty !== undefined && ts.isIdentifier(typeProperty.initializer)) {
    return typeProperty.initializer.text;
  }
  return undefined;
};

/**
 * Gets the `reflect` property of a property options object as a boolean.
 */
export const getPropertyReflect = (
  obj: ts.ObjectLiteralExpression | undefined
) => {
  if (obj === undefined) {
    return false;
  }
  const reflectProperty = getObjectProperty(obj, 'reflect');
  if (reflectProperty === undefined) {
    return false;
  }
  return reflectProperty.initializer.kind === ts.SyntaxKind.TrueKeyword;
};

/**
 * Gets the `converter` property of a property options object.
 */
export const getPropertyConverter = (
  obj: ts.ObjectLiteralExpression | undefined
) => {
  if (obj === undefined) {
    return undefined;
  }
  return getObjectProperty(obj, 'converter');
};

/**
 * Gets a named property from an object literal expression.
 *
 * Only returns a value for `{k: v}` property assignments. Does not work for
 * shorthand properties (`{k}`), methods, or accessors.
 */
const getObjectProperty = (obj: ts.ObjectLiteralExpression, name: string) =>
  obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === name
  ) as ts.PropertyAssignment | undefined;
