/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {BLANK_LINE_PLACEHOLDER_COMMENT} from './preserve-blank-lines.js';
import {getHeritage, isStatic} from './internal/util.js';

/**
 * TypeScript transformer which improves the readability of the default
 * TypeScript constructor transform.
 *
 * This transform does the following:
 *
 * - If the constructor was declared in the original source, it will be restored
 *   to its original position.
 *
 * - If the constructor was NOT declared in the original source, it will be
 *   moved just below the final static member of the class, and a blank line
 *   placeholder comment will be added above.
 *
 * - Simplify `super(...)` calls to `super()` in class constructors, unless the
 *   class has any super-classes with constructors that takes parameters.
 *
 * IMPORTANT: This class MUST run as an "after" transformer. If it is run as a
 * "before" transformer, it won't have access to synthesized constructors, and
 * will have no effect.
 */
export function constructorCleanupTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const toDelete = new WeakSet<ts.Node>();
    const visit = (node: ts.Node): ts.VisitResult<ts.Node | undefined> => {
      if (toDelete.has(node)) {
        return undefined;
      }
      if (ts.isClassDeclaration(node)) {
        node = cleanupClassConstructor(node, context, program, toDelete);
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (file) => {
      return ts.visitNode(file, visit) as ts.SourceFile;
    };
  };
}

const cleanupClassConstructor = (
  class_: ts.ClassDeclaration,
  context: ts.TransformationContext,
  program: ts.Program,
  toDelete: WeakSet<ts.Node>
): ts.Node => {
  let ctor: ts.ConstructorDeclaration | undefined;
  let ctorIdx = -1;
  for (let i = 0; i < class_.members.length; i++) {
    const member = class_.members[i]!;
    if (ts.isConstructorDeclaration(member)) {
      ctor = member;
      ctorIdx = i;
      break;
    }
  }

  if (ctor === undefined) {
    return class_;
  }

  // The "synthesized" flag is added when TypeScript creates or modifies the
  // constructor. If it's missing, the constructor is still in its original
  // source position, so we don't need to do anything.
  if (!(ctor.flags & ts.NodeFlags.Synthesized)) {
    return class_;
  }

  // Otherwise, the constructor has been repositioned. Whenever TypeScript
  // touches the constructor, it moves it to the very top of the class,
  // regardless of its original source order. Let's move it somewhere more sane.
  let newCtorIdx;

  // When the built-in TypeScript class field transformer synthesizes a
  // constructor, it gives it the position of its class. Other transformers
  // might not set a position at all, so it will default to -1.
  const hasOriginalSourcePosition = ctor.pos !== class_.pos && ctor.pos !== -1;

  if (hasOriginalSourcePosition) {
    // The constructor existed in the original source. Move it back.
    newCtorIdx = class_.members.length - 1;
    for (let i = 0; i < class_.members.length; i++) {
      if (ctor.pos < class_.members[i]!.pos) {
        newCtorIdx = i - 1;
        break;
      }
    }
  } else {
    // The constructor was fully synthesized, so it has no original source
    // position. Move it just below the final static member, since that's a more
    // common style.
    newCtorIdx = 0;
    for (let i = class_.members.length - 1; i >= 0; i--) {
      if (isStatic(class_.members[i]!)) {
        newCtorIdx = ctorIdx > i ? i + 1 : i;
        break;
      }
    }
    if (newCtorIdx > 0) {
      // Also add a blank line placeholder comment.
      ts.addSyntheticLeadingComment(
        ctor,
        ts.SyntaxKind.SingleLineCommentTrivia,
        BLANK_LINE_PLACEHOLDER_COMMENT,
        /* trailing newline */ true
      );
    }
    // Since this constructor was fully synthesized, it will always have a
    // `super(...arguments)` call. Often we don't actually need the
    // `...arguments` argument. Remove it if none of our ancestor classes have
    // any constructor parameters. Note this fails in the case that an ancestor
    // constructor directly uses `arguments` in its body, but that should be
    // rare.
    if (
      !anyAncestorConstructorHasParameters(class_, program.getTypeChecker())
    ) {
      const superSpreadArgument = findSuperSpreadArgument(ctor);
      if (superSpreadArgument !== undefined) {
        // Note that we can't just empty the call's argument list, since we
        // can't mutate the AST directly. We're going to visit it anyway since
        // we walk the whole program, so we'll delete it then.
        toDelete.add(superSpreadArgument);
      }
    }
  }

  if (newCtorIdx === ctorIdx) {
    return class_;
  }

  const newMembers = [...class_.members];
  newMembers.splice(ctorIdx, 1);
  newMembers.splice(newCtorIdx, 0, ctor);

  const newClass = context.factory.createClassDeclaration(
    class_.modifiers,
    class_.name,
    class_.typeParameters,
    class_.heritageClauses,
    newMembers
  );

  // Copy over class comments.
  ts.setTextRange(newClass, {pos: class_.getFullStart(), end: class_.getEnd()});
  ts.setSyntheticLeadingComments(
    newClass,
    ts.getSyntheticLeadingComments(class_)
  );

  return newClass;
};

/**
 * Return whether the given class or any of its ancestor classes have a
 * constructor with one or more parameters.
 */
const anyAncestorConstructorHasParameters = (
  class_: ts.ClassDeclaration,
  checker: ts.TypeChecker
) => {
  for (const c of getHeritage(class_, checker)) {
    for (const member of c.members) {
      if (ts.isConstructorDeclaration(member)) {
        if (member.parameters && member.parameters.length > 0) {
          return true;
        }
        break;
      }
    }
  }
  return false;
};

/**
 * If the given constructor has a `super(...arguments)` call, return the
 * `...arguments` argument.
 */
const findSuperSpreadArgument = (
  ctor: ts.ConstructorDeclaration
): ts.Expression | undefined => {
  const superCall = ctor.body?.statements?.[0];
  if (
    superCall &&
    ts.isExpressionStatement(superCall) &&
    ts.isCallExpression(superCall.expression) &&
    superCall.expression.expression.kind === ts.SyntaxKind.SuperKeyword &&
    superCall.expression.arguments?.length === 1 &&
    ts.isSpreadElement(superCall.expression.arguments[0]!) &&
    ts.isIdentifier(superCall.expression.arguments[0].expression) &&
    superCall.expression.arguments[0].expression.text === 'arguments'
  ) {
    return superCall.expression.arguments[0];
  }
  return undefined;
};
