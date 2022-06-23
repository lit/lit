/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with mixins
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {MixinDeclaration} from '../model.js';
import {ProgramContext} from '../program-context.js';
import {getClassDeclaration} from './classes.js';

/**
 * If the given variable declaration was a mixin function, returns a
 * MixinDeclaration, otherwise returns undefined.
 *
 * The mixin logic requires a few important heuristics to be met in order to be
 * detected as a mixin. This shouldn't be too onerous since TypeScript also
 * requires a fairly rigid structure (described at
 * https://lit.dev/docs/composition/mixins/#mixins-in-typescript):
 *
 * 1. Must be a single const assignment to an arrow function. TODO(kschaaf)
 *    expand this to function declarations once those are added to analyzer.
 * 2. Must have a type parameter of `<T extends Constructor<MyBaseClass>>`; even
 *    though Constructor isn't a TS built-in (yet) and we could look for a
 *    class-like interface, for now we'll just require users to use a
 *    `Constructor` named type helper. The generic name can be whatever, need
 *    not be "T".
 * 3. Must have a parameter that accepts the super class being extended, typed
 *    to the type parameter found in (2) (e.g. `T`, or whatever it was named).
 * 4. Must have a function block containing a class declaration and a return
 *    statement returning that class. Class expressions returned from a
 *    block-less arrow function is not supported for now, since decorators don't
 *    work with those in TS anyway.
 * 5. The return value must be cast to the super class type parameter (e.g. T),
 *    or an intersection of it with the mixin's interface. The cast can either
 *    be on the return value, i.e.
 *     `return MyClass as T & Constructor<MyInterface>`
 *                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *    or in the function's type position, i.e.
 *     `const MyMixin = <T...>(s: T): T & Constructor<MyInterface> => {...}`
 *                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^q
 * If the function is unannotated and does not match the above mixin shape, it
 * will silently just be analyzed as a simple function and not a mixin. However,
 * the `@mixin` annotation can be added to produce specific diagnostic errors
 * when a condition for being analyzed as a mixin are not met.
 */
export const maybeGetMixinDeclaration = (
  declaration: ts.VariableDeclaration,
  programContext: ProgramContext
): MixinDeclaration | undefined => {
  const hasMixinHint = ts
    .getJSDocTags(declaration)
    .some((tag) => tag.tagName.text === 'mixin');
  const notMixin = (node: ts.Node, message: string) => {
    if (hasMixinHint) {
      throw new DiagnosticsError(node, message);
    } else {
      return undefined;
    }
  };
  const fn = declaration.initializer;
  if (!fn || !ts.isArrowFunction(fn)) {
    return notMixin(
      fn ?? declaration,
      `Expected mixin to be defined as a single const assignment to an ` +
        `arrow function.`
    );
  }
  if (!fn.typeParameters || fn.typeParameters.length < 1) {
    // TODO(kschaaf): This expects a conventional syntax-based "Constructor"
    // type param; we could also use the type-checker to be less prescriptive
    // and find a type param that resolves to `{new: something}`, but it would
    // take more work to pull a constructor constraint out of it
    return notMixin(
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
          return notMixin(
            constraint,
            `Expected mixin Constructor constraint to have zero or one ` +
              `type arguments.`
          );
        }
        const superClassConstraint = constraint.typeArguments![0];
        superClassConstraintType =
          programContext.checker.getTypeFromTypeNode(superClassConstraint);
      }
    }
  }
  if (superClassTemplateName === undefined) {
    return notMixin(
      fn,
      `Expected mixin to have a type parameter of "Constructor"`
    );
  }
  if (!fn.parameters || fn.parameters.length < 1) {
    return notMixin(
      fn,
      `Expected mixin to have a single "superClass" parameter of type T ` +
        `(where T is a Constructor)`
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
    return notMixin(
      fn,
      `Expected mixin to have a superClass parameter of type ` +
        `"${superClassTemplateName}"`
    );
  }
  const functionBody = fn.body;
  if (functionBody === undefined) {
    return notMixin(fn, `Expected mixin to have a block function body.`);
  }
  if (!ts.isBlock(functionBody)) {
    return notMixin(
      fn.body,
      `Expected mixin to have a block function body; arrow-function class ` +
        `expression syntax is not supported.`
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
    return notMixin(
      fn.body,
      `Expected mixin to contain a class declaration statement.`
    );
  }
  if (!returnStatement) {
    return notMixin(
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
      return notMixin(
        returnStatement,
        `Expected mixin to explicitly type the return value to ` +
          `${superClassTemplateName} (or an intersection of ` +
          `${superClassTemplateName} with the mixin's interface).`
      );
    }
    returnType = returnStatement.expression.type;
  }
  if (ts.isTypeReferenceNode(returnType)) {
    if (!ts.isIdentifier(returnType.typeName)) {
      return notMixin(
        returnType.typeName,
        `Mixins must explicitly type the return value to ` +
          `${superClassTemplateName} (or an intersection of ` +
          `${superClassTemplateName} with the mixin's interface).`
      );
    }
    if (returnType.typeName.text !== superClassTemplateName) {
      return notMixin(
        returnType.typeName,
        `Mixins must explicitly type the return value to ` +
          `${superClassTemplateName} (or an intersection of ` +
          `${superClassTemplateName} with the mixin's interface).`
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
      return notMixin(
        returnType,
        `Mixins must explicitly type the return value to ` +
          `${superClassTemplateName} (or an intersection of ` +
          `${superClassTemplateName} with the mixin's interface).`
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
