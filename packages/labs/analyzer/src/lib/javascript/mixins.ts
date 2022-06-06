/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {MixinDeclaration} from '../model.js';
import {ProgramContext} from '../program-context.js';
import {getClassDeclaration} from './classes.js';

/**
 * @fileoverview
 *
 * Utilities for working with mixins
 */

export const maybeGetMixinDeclaration = (
  declaration: ts.VariableDeclaration,
  programContext: ProgramContext
) => {
  const isMixin = ts
    .getJSDocTags(declaration)
    .some((tag) => tag.tagName.text === 'mixin');
  const throwIfMixin = (node: ts.Node, message: string) => {
    if (isMixin) {
      throw new DiagnosticsError(node, message);
    } else {
      return undefined;
    }
  };
  const fn = declaration.initializer;
  if (!fn || !ts.isArrowFunction(fn)) {
    return throwIfMixin(
      fn ?? declaration,
      'Expected mixin to be defined as a single const assignment to an arrow function.'
    );
  }
  if (!fn.typeParameters || fn.typeParameters.length < 1) {
    // TODO(kschaaf): This expects a conventional syntax-based "Constructor"
    // type param; we could also use the type-checker to be less prescriptive
    // and find a type param that resolves to `{new: something}`, but it would
    // take more work to pull a constructor constraint out of it
    return throwIfMixin(
      fn,
      `Expected mixin to have a type parameter of "Constructor"`
    );
  }
  let superClassTemplateName: string | undefined = undefined;
  let superClassConstraintType;
  for (const typeParam of fn.typeParameters) {
    if (
      ts.isIdentifier(typeParam.name) &&
      typeParam.constraint !== undefined &&
      ts.isTypeReferenceNode(typeParam.constraint) &&
      ts.isIdentifier(typeParam.constraint.typeName) &&
      typeParam.constraint.typeName.text === 'Constructor'
    ) {
      superClassTemplateName = typeParam.name.text;
      const {constraint} = typeParam;
      if (constraint?.typeArguments !== undefined) {
        if (constraint.typeArguments.length > 1) {
          return throwIfMixin(
            constraint,
            'Expected mixin Constructor constraint to have zero or one type arguments.'
          );
        }
        const superClassConstraint = constraint.typeArguments![0];
        superClassConstraintType =
          programContext.checker.getTypeFromTypeNode(superClassConstraint);
      }
    }
  }
  if (superClassTemplateName === undefined) {
    return throwIfMixin(
      fn,
      `Expected mixin to have a type parameter of "Constructor"`
    );
  }
  if (!fn.parameters || fn.parameters.length < 1) {
    return throwIfMixin(
      fn,
      `Expected mixin to have a single "superClass" parameter of type T (where T is a Constructor)`
    );
  }
  let foundSuperClass = false;
  for (const param of fn.parameters) {
    if (
      param.type !== undefined &&
      ts.isTypeReferenceNode(param.type) &&
      ts.isIdentifier(param.type.typeName) &&
      param.type.typeName.text === superClassTemplateName
    ) {
      foundSuperClass = true;
      break;
    }
  }
  if (!foundSuperClass) {
    return throwIfMixin(
      fn,
      `Expected mixin to have a superClass parameter of type "${superClassTemplateName}"`
    );
  }
  const functionBody = fn.body;
  if (functionBody === undefined) {
    return throwIfMixin(fn, `Expected mixin to have a block function body.`);
  }
  if (!ts.isBlock(functionBody)) {
    return throwIfMixin(
      fn.body,
      `Expected mixin to have a block function body; arrow-function class expression syntax is not supported.`
    );
  }
  let classDeclaration!: ts.ClassDeclaration;
  let returnStatement!: ts.ReturnStatement;
  functionBody.statements.forEach((s) => {
    if (ts.isClassDeclaration(s)) {
      classDeclaration = s;
    }
    if (ts.isReturnStatement(s)) {
      returnStatement = s;
    }
  });
  if (!classDeclaration) {
    return throwIfMixin(
      fn.body,
      `Expected mixin to contain a class declaration statement.`
    );
  }
  if (!returnStatement) {
    return throwIfMixin(
      fn.body,
      `Expected mixin to contain a return statement returning a class.`
    );
  }
  let returnType = fn.type;
  if (!returnType) {
    if (
      !returnStatement.expression ||
      !ts.isAsExpression(returnStatement.expression)
    ) {
      return throwIfMixin(
        returnStatement,
        `Expected mixin to explicitly type the return value to ${superClassTemplateName} (or an intersection of ${superClassTemplateName} with the mixin's interface).`
      );
    }
    returnType = returnStatement.expression.type;
  }
  if (ts.isTypeReferenceNode(returnType)) {
    if (!ts.isIdentifier(returnType.typeName)) {
      return throwIfMixin(
        returnType.typeName,
        `Mixins must explicitly type the return value to ${superClassTemplateName} (or an intersection of ${superClassTemplateName} with the mixin's interface).`
      );
    }
    if (returnType.typeName.text !== superClassTemplateName) {
      return throwIfMixin(
        returnType.typeName,
        `Mixins must explicitly type the return value to ${superClassTemplateName} (or an intersection of ${superClassTemplateName} with the mixin's interface).`
      );
    }
  } else if (ts.isIntersectionTypeNode(returnType)) {
    if (
      !returnType.types.some(
        (t) =>
          ts.isTypeReferenceNode(t) &&
          ts.isIdentifier(t.typeName) &&
          t.typeName.text === superClassTemplateName
      )
    ) {
      return throwIfMixin(
        returnType,
        `Mixins must explicitly type the return value to ${superClassTemplateName} (or an intersection of ${superClassTemplateName} with the mixin's interface).`
      );
    }
  }
  const name =
    classDeclaration.name ?? ts.isIdentifier(declaration.name)
      ? declaration.name.getText()
      : '';
  return new MixinDeclaration({
    node: fn,
    name,
    classDeclaration: getClassDeclaration(classDeclaration, programContext),
    superClassConstraintType,
  });
};
