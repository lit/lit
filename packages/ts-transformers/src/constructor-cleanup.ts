/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {BLANK_LINE_PLACEHOLDER_COMMENT} from './preserve-blank-lines';

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
 * IMPORTANT: This class MUST run as an "after" transformer. If it is run as a
 * "before" transformer, it won't have access to synthesized constructors, and
 * will have no efect.
 */
export default function constructorCleanupTransformer(): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (ts.isClassDeclaration(node)) {
        node = cleanupClassConstructor(node, context);
      }
      return ts.visitEachChild(node, visit, context);
    };
    return (file) => {
      return ts.visitNode(file, visit);
    };
  };
}

const cleanupClassConstructor = (
  class_: ts.ClassDeclaration,
  context: ts.TransformationContext
): ts.Node => {
  let ctor: ts.ConstructorDeclaration | undefined;
  let ctorIdx = -1;
  for (let i = 0; i < class_.members.length; i++) {
    const member = class_.members[i];
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

  // When TypeScript synthesizes a constructor from scratch, it gives it the
  // position of its class.
  const hasOriginalSourcePosition = ctor.pos !== class_.pos;

  if (hasOriginalSourcePosition) {
    // The constructor existed in the original source. Move it back.
    newCtorIdx = class_.members.length - 1;
    for (let i = 0; i < class_.members.length; i++) {
      if (ctor.pos < class_.members[i].pos) {
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
      const isStatic =
        class_.members[i].modifiers?.find(
          (modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword
        ) !== undefined;
      if (isStatic) {
        newCtorIdx = i;
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
  }

  if (newCtorIdx === ctorIdx) {
    return class_;
  }

  const newMembers = [...class_.members];
  newMembers.splice(ctorIdx, 1);
  newMembers.splice(newCtorIdx, 0, ctor);

  const newClass = context.factory.createClassDeclaration(
    class_.decorators,
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
