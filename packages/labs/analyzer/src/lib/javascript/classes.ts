/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for working with classes
 */

import ts from 'typescript';
import {DiagnosticsError} from '../errors.js';
import {ClassDeclaration, MixinDeclarationNode} from '../model.js';
import {ProgramContext} from '../program-context.js';
import {
  isLitElement,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';

export const getClassDeclaration = (
  declaration: ts.ClassDeclaration,
  programContext: ProgramContext
): ClassDeclaration => {
  if (isLitElement(declaration, programContext)) {
    return getLitElementDeclaration(declaration, programContext);
  } else {
    return new ClassDeclaration({
      name: declaration.name?.text,
      node: declaration,
      ...getHeritage(declaration, programContext),
    });
  }
};

export type Heritage = {
  mixinDeclarationNodes: MixinDeclarationNode[];
  superClassDeclarationNode: ts.Declaration | undefined;
  superClassType: ts.Type | undefined;
};

/**
 * Returns the superClass and any applied mixins for a given class declaration.
 */
export const getHeritage = (
  declaration: ts.ClassLikeDeclaration,
  programContext: ProgramContext
): Heritage => {
  const classInterfaceType = getClassInterfaceType(declaration, programContext);
  let superClassDeclarationNode = undefined;
  const mixins: MixinDeclarationNode[] = [];
  const extendsClause = declaration.heritageClauses?.find(
    (c) => c.token === ts.SyntaxKind.ExtendsKeyword
  );
  if (extendsClause !== undefined) {
    if (extendsClause.types.length !== 1) {
      throw new DiagnosticsError(
        extendsClause,
        'Internal error: did not expect extends clause to have multiple types'
      );
    }
    superClassDeclarationNode = getSuperClassAndMixins(
      extendsClause.types[0].expression,
      getIntersectionTypeSet(classInterfaceType, programContext),
      mixins,
      programContext
    );
  }
  return {
    mixinDeclarationNodes: mixins,
    superClassDeclarationNode,
    superClassType: classInterfaceType,
  };
};

/**
 * For a given ts.Type, expands all intersected types contained within it into a
 * Set of type strings.
 *
 * For example, a type of `Foo & Bar & Baz` becomes `new Set(['Foo', 'Bar',
 * 'Baz'])`
 */
const getIntersectionTypeSet = (
  type: ts.Type,
  programContext: ProgramContext,
  set = new Set<string>()
): Set<string> => {
  if (type.isIntersection()) {
    type.types.forEach((type) =>
      getIntersectionTypeSet(type, programContext, set)
    );
  } else {
    set.add(programContext.checker.typeToString(type));
  }
  return set;
};

/**
 * Tests whether the given expression evaluates to a constructor that implements
 * at least a subset of the given interfaceType (where interfaceType may contain
 * one or more intersections of interfaces).
 *
 * For example, for interfaceType `Foo & Bar`, and given:
 * - makeFoo: () => Constructor<Foo>
 * - makeBar: () => typeof Bar
 *
 * Then returnsConstructorForInterfaceSubset() returns true for these
 * expressions (the type of each expression is a constructor for a subset of
 * `interfaceType`):
 * - makeFoo()
 * - makeBar()
 * - Foo
 * - Bar
 *
 * Note that constructors must either be expressed as `typeof SomeClass` or
 * `Constructor<SomeInterface>`, the latter being important for manually typing
 * mixin interfaces and casting the return value of a mixin, since TS sucks at
 * inferring mixin interfaces.
 *
 * An alternative here would be to use ts-simple-type and check isAssignableTo,
 * but seems a bit overkill.
 */
const returnsConstructorForInterfaceSubset = (
  expression: ts.Expression,
  interfaceTypeSet: Set<string>,
  programContext: ProgramContext
) => {
  const expressionType = programContext.checker.getTypeAtLocation(expression);
  // Check whether the expression returns a constructor that constructs at least
  // one type in the interfaceSet
  for (const t of getIntersectionTypeSet(expressionType, programContext)) {
    const ctorMatch = t.match(/(Constructor<(?<c1>\w+)>)|(typeof (?<c2>\w+))/);
    const constructs = ctorMatch?.groups?.c1 ?? ctorMatch?.groups?.c2;
    if (constructs !== undefined && interfaceTypeSet.has(constructs)) {
      return true;
    }
  }
  return false;
};

/**
 * Given a classInterfaceType, recursively walks an extends clause expression
 * looking for mixins and the concrete base class that was extended.
 *
 * For example, given:
 * - class Sub extends A(x(), B('hi', y(), C(Super)), z()) { }
 *
 * And given:
 * - A = <T extends HTMLElement>(superClass: T) => T & Constructor<IA>
 * - B = <T extends HTMLElement>(superClass: T) => T & Constructor<IB>
 * - C = <T extends HTMLElement>(superClass: T) => T & Constructor<IC>
 * - x, y return types unrelated to the class's interface type
 *
 * Then the classInterfaceType inferred by the type checker for Sub will be
 * `typeof Super & Constructor<IA> & Constructor<IB> & Constructor<IC>`.
 *
 * We then descend into the extends clause expression:
 * 1. `A()` returns an intersection containing Constructor<IA>, which is a
 *    subset of the inferred class interface, so add A to the mixins list and
 *    check its arguments.
 * 2. `x()` does not return a subset of the inferred class interface, skip
 * 3. `B()` returns an intersection containing Constructor<IB>, which is a
 *    subset of the inferred class interface, so add B to the mixins list and
 *    check its arguments.
 * 4. `'hi'` is not a call expression or an identifier so it can't be a mixin or
 *    super class, so skip.
 * 5. `y()` does not return a subset of the inferred class interface, skip
 * 6. `C()` returns an intersection containing Constructor<IC>, which is a
 *    subset of the inferred class interface, so add C to the mixins list and
 *    check its arguments.
 * 7. `Super` is an identifier whose type is a subset of the inferred class
 *    interface; since it's an identifier, this is the concrete super class.
 * 8. `z()` does not return a subset of the inferred class interface, skip
 */
export const getSuperClassAndMixins = (
  expression: ts.Expression,
  interfaceTypeSet: Set<string>,
  foundMixins: MixinDeclarationNode[],
  programContext: ProgramContext
): ts.Declaration | undefined => {
  // Only continue searching for the superClass (and any mixins) if this
  // expression constructs at least a subset of the type of the extends clause
  if (
    !returnsConstructorForInterfaceSubset(
      expression,
      interfaceTypeSet,
      programContext
    )
  ) {
    return undefined;
  }
  // TODO(kschaaf) Could add support for inline class expressions here as well
  if (ts.isIdentifier(expression)) {
    // Found the superClass, as a direct identifier in the extends clause or as
    // an argument to a mixin
    const declaration =
      programContext.checker.getSymbolAtLocation(expression)?.declarations?.[0];
    if (declaration === undefined) {
      throw new DiagnosticsError(
        expression,
        'Could not find declaration for this symbol.'
      );
    }
    return declaration;
  } else if (
    ts.isCallExpression(expression) &&
    ts.isIdentifier(expression.expression)
  ) {
    const symbol = programContext.checker.getSymbolAtLocation(
      expression.expression
    );
    const declaration = symbol?.getDeclarations()?.[0];
    foundMixins.push(declaration as MixinDeclarationNode);
    let foundSuperClass = undefined;
    for (const arg of expression.arguments) {
      const superClass = getSuperClassAndMixins(
        arg,
        interfaceTypeSet,
        foundMixins,
        programContext
      );
      if (superClass !== undefined) {
        if (foundSuperClass !== undefined) {
          const name = (superClass as ts.Declaration & {name: ts.Identifier})
            .name;
          throw new DiagnosticsError(
            expression,
            `Internal error: found more than one concrete superclass ` +
              `in extends clause: '${name?.text}' and ${name?.text}`
          );
        }
        foundSuperClass = superClass;
      }
    }
    return foundSuperClass;
  } else {
    // We only look for mixins / superclass in calls or identifiers
    return undefined;
  }
};

export const getClassInterfaceType = (
  declaration: ts.ClassLikeDeclaration,
  programContext: ProgramContext
): ts.Type => {
  const type = programContext.checker.getTypeAtLocation(
    declaration
  ) as ts.InterfaceType;
  return programContext.checker.getBaseTypes(type)[0];
};
