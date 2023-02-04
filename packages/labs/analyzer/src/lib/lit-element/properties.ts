/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing reactive property declarations
 */

import ts from 'typescript';
import {LitClassDeclaration} from './lit-element.js';
import {ReactiveProperty} from '../model.js';
import {getPropertyDecorator, getPropertyOptions} from './decorators.js';
import {DiagnosticsError} from '../errors.js';
import {hasStaticModifier} from '../utils.js';

export const getProperties = (classDeclaration: LitClassDeclaration) => {
  const reactiveProperties = new Map<string, ReactiveProperty>();
  const undecoratedProperties = new Map<string, ts.Node>();

  // Filter down to just the property and getter declarations
  const propertyDeclarations = classDeclaration.members.filter(
    (m) => ts.isPropertyDeclaration(m) || ts.isGetAccessorDeclaration(m)
  ) as unknown as ts.NodeArray<ts.PropertyDeclaration>;

  let staticProperties;

  for (const prop of propertyDeclarations) {
    if (!ts.isIdentifier(prop.name)) {
      throw new DiagnosticsError(prop, 'Unsupported property name');
    }
    const name = prop.name.text;

    const propertyDecorator = getPropertyDecorator(prop);
    if (propertyDecorator !== undefined) {
      // Decorated property; get property options from the decorator and add
      // them to the reactiveProperties map
      const options = getPropertyOptions(propertyDecorator);
      reactiveProperties.set(name, {
        name,
        attribute: getPropertyAttribute(options, name),
        typeOption: getPropertyType(options),
        reflect: getPropertyReflect(options),
        converter: getPropertyConverter(options),
      });
    } else if (name === 'properties' && hasStaticModifier(prop)) {
      // This field has the static properties block (initializer or getter).
      // Note we will process this after the loop so that the
      // `undecoratedProperties` map is complete before processing the static
      // properties block.
      staticProperties = prop;
    } else if (!hasStaticModifier(prop)) {
      // Store the declaration node for any undecorated properties. In a TS
      // program that happens to use a static properties block along with
      // the `declare` keyword to type the field, we can use this node to
      // get/infer the TS type of the field from
      undecoratedProperties.set(name, prop);
    }
  }

  // Handle static properties block (initializer or getter).
  if (staticProperties !== undefined) {
    addPropertiesFromStaticBlock(staticProperties, reactiveProperties);
  }

  return reactiveProperties;
};

/**
 * Given a static properties declaration (field or getter), add property
 * options to the provided `reactiveProperties` map.
 */
const addPropertiesFromStaticBlock = (
  properties: ts.PropertyDeclaration | ts.GetAccessorDeclaration,
  reactiveProperties: Map<string, ReactiveProperty>
) => {
  // Find the object literal from the initializer or getter return value
  const object = getStaticPropertiesObjectLiteral(properties);
  // Loop over each key/value in the object and add them to the map
  for (const prop of object.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      ts.isObjectLiteralExpression(prop.initializer)
    ) {
      const name = prop.name.text;
      const options = prop.initializer;
      reactiveProperties.set(name, {
        name,
        attribute: getPropertyAttribute(options, name),
        typeOption: getPropertyType(options),
        reflect: getPropertyReflect(options),
        converter: getPropertyConverter(options),
      });
    } else {
      throw new DiagnosticsError(
        prop,
        'Unsupported static properties entry. Expected a string identifier key and object literal value.'
      );
    }
  }
};

/**
 * Find the object literal for a static properties block.
 *
 * If a ts.PropertyDeclaration, it will look like:
 *
 *   static properties = { ... };
 *
 * If a ts.GetAccessorDeclaration, it will look like:
 *
 *   static get properties() {
 *     return {... }
 *   }
 */
const getStaticPropertiesObjectLiteral = (
  properties: ts.PropertyDeclaration | ts.GetAccessorDeclaration
): ts.ObjectLiteralExpression => {
  let object: ts.ObjectLiteralExpression | undefined = undefined;
  if (
    ts.isPropertyDeclaration(properties) &&
    properties.initializer !== undefined &&
    ts.isObjectLiteralExpression(properties.initializer)
  ) {
    // `properties` has a static initializer; get the object from there
    object = properties.initializer;
  } else if (ts.isGetAccessorDeclaration(properties)) {
    // Object was in a static getter: find the object in the return value
    const statements = properties.body?.statements;
    const statement = statements?.[statements.length - 1];
    if (
      statement !== undefined &&
      ts.isReturnStatement(statement) &&
      statement.expression !== undefined &&
      ts.isObjectLiteralExpression(statement.expression)
    ) {
      object = statement.expression;
    }
  }
  if (object === undefined) {
    throw new DiagnosticsError(
      properties,
      `Unsupported static properties format. Expected an object literal assigned in a static initializer or returned from a static getter.`
    );
  }
  return object;
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
