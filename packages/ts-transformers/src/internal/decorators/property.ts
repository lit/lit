/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {BLANK_LINE_PLACEHOLDER_COMMENT} from '../../preserve-blank-lines.js';

import type {LitClassContext} from '../lit-class-context.js';
import type {MemberDecoratorVisitor} from '../visitor.js';
import {removeDecorators} from '../util.js';

/**
 * Copies the comments and, optionally, leading blank lines from one node to
 * another.
 *
 * @param fromNode Node from which to copy comments.
 * @param toNode Node where comments should be copied to.
 * @param blankLines (Default: false) Whether to preserve leading blank lines.
 *   Useful for classmembers not moved to the constructor.
 */
const copyComments = (
  fromNode: ts.Node,
  toNode: ts.Node,
  blankLines = false
) => {
  // Omit blank lines from the PreserveBlankLines transformer, because they
  // usually look awkward in the constructor.
  const nonBlankLineSyntheticComments = ts
    .getSyntheticLeadingComments(fromNode)
    ?.filter(
      (comment) => blankLines || comment.text !== BLANK_LINE_PLACEHOLDER_COMMENT
    );
  ts.setSyntheticLeadingComments(toNode, nonBlankLineSyntheticComments);
};

/**
 * Transform:
 *
 *   @property({type: Number})
 *   foo = 123;
 *
 * Into:
 *
 *   static get properties() {
 *     return {
 *       foo: {type: Number}
 *     }
 *   }
 *
 *   constructor() {
 *     super(...arguments);
 *     this.foo = 123;
 *   }
 */
export class PropertyVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  decoratorName = 'property';
  protected readonly _factory: ts.NodeFactory;

  constructor({factory}: ts.TransformationContext) {
    this._factory = factory;
  }

  visit(
    litClassContext: LitClassContext,
    propertyOrGetter: ts.ClassElement,
    decorator: ts.Decorator
  ) {
    const isGetter = ts.isGetAccessor(propertyOrGetter);
    if (!ts.isPropertyDeclaration(propertyOrGetter) && !isGetter) {
      return;
    }
    if (!ts.isIdentifier(propertyOrGetter.name)) {
      return;
    }
    if (!ts.isCallExpression(decorator.expression)) {
      return;
    }
    const [arg0] = decorator.expression.arguments;
    if (!(arg0 === undefined || ts.isObjectLiteralExpression(arg0))) {
      return;
    }
    const options = this._augmentOptions(arg0);
    const name = propertyOrGetter.name.text;
    const factory = this._factory;

    if (isGetter) {
      // Decorators is readonly so clone the property.
      const getterWithoutDecorators = factory.createGetAccessorDeclaration(
        removeDecorators(factory, propertyOrGetter.modifiers),
        propertyOrGetter.name,
        propertyOrGetter.parameters,
        propertyOrGetter.type,
        propertyOrGetter.body
      );

      copyComments(propertyOrGetter, getterWithoutDecorators, true);

      litClassContext.litFileContext.nodeReplacements.set(
        propertyOrGetter,
        getterWithoutDecorators
      );
    } else {
      // Delete the member property
      litClassContext.litFileContext.nodeReplacements.set(
        propertyOrGetter,
        undefined
      );
    }
    litClassContext.reactiveProperties.push({name, options});

    if (!isGetter && propertyOrGetter.initializer !== undefined) {
      const initializer = factory.createExpressionStatement(
        factory.createBinaryExpression(
          factory.createPropertyAccessExpression(
            factory.createThis(),
            factory.createIdentifier(name)
          ),
          factory.createToken(ts.SyntaxKind.EqualsToken),
          propertyOrGetter.initializer
        )
      );
      ts.setTextRange(initializer, propertyOrGetter);
      copyComments(propertyOrGetter, initializer);
      litClassContext.extraConstructorStatements.push(initializer);
    }
  }

  protected _augmentOptions(
    options: ts.ObjectLiteralExpression | undefined
  ): ts.ObjectLiteralExpression | undefined {
    return options;
  }
}
