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

import type ts from 'typescript';
import {LitClassDeclaration} from './lit-element.js';
import {ReactiveProperty, AnalyzerInterface} from '../model.js';
import {getTypeForNode} from '../types.js';
import {getPropertyDecorator, getPropertyOptions} from './decorators.js';
import {hasStaticModifier} from '../utils.js';
import {DiagnosticCode} from '../diagnostic-code.js';
import {createDiagnostic} from '../errors.js';

export type TypeScript = typeof ts;

export const getProperties = (
  classDeclaration: LitClassDeclaration,
  analyzer: AnalyzerInterface
) => {
  const {typescript: ts} = analyzer;
  const reactiveProperties = new Map<string, ReactiveProperty>();
  const undecoratedProperties = new Map<string, ts.Node>();

  // Filter down to just the property and getter declarations
  const propertyDeclarations = classDeclaration.members.filter(
    (m) => ts.isPropertyDeclaration(m) || ts.isGetAccessorDeclaration(m)
  ) as unknown as ts.NodeArray<ts.PropertyDeclaration>;

  let staticProperties;

  for (const prop of propertyDeclarations) {
    if (!ts.isIdentifier(prop.name)) {
      analyzer.addDiagnostic(
        createDiagnostic({
          typescript: ts,
          node: prop,
          message:
            '@lit-labs/analyzer only supports analyzing class properties named with plain identifiers. This ' +
            'property was ignored.',
          category: ts.DiagnosticCategory.Warning,
          code: DiagnosticCode.UNSUPPORTED,
        })
      );
      continue;
    }
    const name = prop.name.text;

    const propertyDecorator = getPropertyDecorator(ts, prop);
    if (propertyDecorator !== undefined) {
      // Decorated property; get property options from the decorator and add
      // them to the reactiveProperties map
      const options = getPropertyOptions(ts, propertyDecorator);
      reactiveProperties.set(name, {
        name,
        type: getTypeForNode(prop, analyzer),
        attribute: getPropertyAttribute(ts, options, name),
        typeOption: getPropertyType(ts, options),
        reflect: getPropertyReflect(ts, options),
        converter: getPropertyConverter(ts, options),
      });
    } else if (name === 'properties' && hasStaticModifier(ts, prop)) {
      // This field has the static properties block (initializer or getter).
      // Note we will process this after the loop so that the
      // `undecoratedProperties` map is complete before processing the static
      // properties block.
      staticProperties = prop;
    } else if (!hasStaticModifier(ts, prop)) {
      // Store the declaration node for any undecorated properties. In a TS
      // program that happens to use a static properties block along with
      // the `declare` keyword to type the field, we can use this node to
      // get/infer the TS type of the field from
      undecoratedProperties.set(name, prop);
    }
  }

  // Handle static properties block (initializer or getter).
  if (staticProperties !== undefined) {
    addPropertiesFromStaticBlock(
      classDeclaration,
      staticProperties,
      undecoratedProperties,
      reactiveProperties,
      analyzer
    );
  }

  return reactiveProperties;
};

/**
 * Given a static properties declaration (field or getter), add property
 * options to the provided `reactiveProperties` map.
 */
const addPropertiesFromStaticBlock = (
  classDeclaration: LitClassDeclaration,
  properties: ts.PropertyDeclaration | ts.GetAccessorDeclaration,
  undecoratedProperties: Map<string, ts.Node>,
  reactiveProperties: Map<string, ReactiveProperty>,
  analyzer: AnalyzerInterface
) => {
  const {typescript: ts} = analyzer;

  // Add any constructor initializers to the undecorated properties node map
  // from which we can infer types from. This is the primary path that JS source
  // can get their inferred types (in TS, types will come from the undecorated
  // fields passed in, since you need to declare the field to assign it in the
  // constructor).
  addConstructorInitializers(ts, classDeclaration, undecoratedProperties);
  // Find the object literal from the initializer or getter return value
  const object = getStaticPropertiesObjectLiteral(properties, analyzer);
  if (object === undefined) {
    return;
  }
  // Loop over each key/value in the object and add them to the map
  for (const prop of object.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      ts.isObjectLiteralExpression(prop.initializer)
    ) {
      const name = prop.name.text;
      const options = prop.initializer;
      const nodeForType = undecoratedProperties.get(name);
      reactiveProperties.set(name, {
        name,
        type:
          nodeForType !== undefined
            ? getTypeForNode(nodeForType, analyzer)
            : undefined,
        attribute: getPropertyAttribute(ts, options, name),
        typeOption: getPropertyType(ts, options),
        reflect: getPropertyReflect(ts, options),
        converter: getPropertyConverter(ts, options),
      });
    } else {
      analyzer.addDiagnostic(
        createDiagnostic({
          typescript: ts,
          node: prop,
          message:
            'Unsupported static properties entry. Expected a string identifier key and object literal value.',
          code: DiagnosticCode.UNSUPPORTED,
          category: ts.DiagnosticCategory.Warning,
        })
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
  properties: ts.PropertyDeclaration | ts.GetAccessorDeclaration,
  analyzer: AnalyzerInterface
): ts.ObjectLiteralExpression | undefined => {
  const {typescript: ts} = analyzer;

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
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: ts,
        node: properties,
        message: `Unsupported static properties format. Expected an object literal assigned in a static initializer or returned from a static getter.`,
        code: DiagnosticCode.UNSUPPORTED,
        category: ts.DiagnosticCategory.Warning,
      })
    );
  }
  return object;
};

/**
 * Adds any field initializers in the given class's constructor to the provided
 * map. This will be used for inferring the type of fields in JS programs.
 */
const addConstructorInitializers = (
  ts: TypeScript,
  classDeclaration: ts.ClassDeclaration,
  undecoratedProperties: Map<string, ts.Node>
) => {
  const ctor = classDeclaration.forEachChild((node) =>
    ts.isConstructorDeclaration(node) ? node : undefined
  );
  if (ctor !== undefined) {
    ctor.body?.statements.forEach((stmt) => {
      // Look for initializers in the form of `this.foo = xxxx`
      if (
        ts.isExpressionStatement(stmt) &&
        ts.isBinaryExpression(stmt.expression) &&
        ts.isPropertyAccessExpression(stmt.expression.left) &&
        stmt.expression.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
        ts.isIdentifier(stmt.expression.left.name) &&
        !undecoratedProperties.has(stmt.expression.left.name.text)
      ) {
        // Add the initializer expression to the map
        undecoratedProperties.set(
          // Property name
          stmt.expression.left.name.text,
          // Expression from which we can infer a type
          stmt.expression.right
        );
      }
    });
  }
};

/**
 * Gets the `attribute` property of a property options object as a string.
 */
export const getPropertyAttribute = (
  ts: TypeScript,
  obj: ts.ObjectLiteralExpression | undefined,
  propName: string
) => {
  if (obj === undefined) {
    return propName.toLowerCase();
  }
  const attributeProperty = getObjectProperty(ts, obj, 'attribute');
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
  ts: TypeScript,
  obj: ts.ObjectLiteralExpression | undefined
) => {
  if (obj === undefined) {
    return undefined;
  }
  const typeProperty = getObjectProperty(ts, obj, 'type');
  if (typeProperty !== undefined && ts.isIdentifier(typeProperty.initializer)) {
    return typeProperty.initializer.text;
  }
  return undefined;
};

/**
 * Gets the `reflect` property of a property options object as a boolean.
 */
export const getPropertyReflect = (
  ts: TypeScript,
  obj: ts.ObjectLiteralExpression | undefined
) => {
  if (obj === undefined) {
    return false;
  }
  const reflectProperty = getObjectProperty(ts, obj, 'reflect');
  if (reflectProperty === undefined) {
    return false;
  }
  return reflectProperty.initializer.kind === ts.SyntaxKind.TrueKeyword;
};

/**
 * Gets the `converter` property of a property options object.
 */
export const getPropertyConverter = (
  ts: TypeScript,
  obj: ts.ObjectLiteralExpression | undefined
) => {
  if (obj === undefined) {
    return undefined;
  }
  return getObjectProperty(ts, obj, 'converter');
};

/**
 * Gets a named property from an object literal expression.
 *
 * Only returns a value for `{k: v}` property assignments. Does not work for
 * shorthand properties (`{k}`), methods, or accessors.
 */
const getObjectProperty = (
  ts: TypeScript,
  obj: ts.ObjectLiteralExpression,
  name: string
) =>
  obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === name
  ) as ts.PropertyAssignment | undefined;
