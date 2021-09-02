/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {BLANK_LINE_PLACEHOLDER_COMMENT} from '../../preserve-blank-lines.js';

import type {LitClassContext} from '../lit-class-context.js';
import type {MemberDecoratorVisitor} from '../visitor.js';

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
    property: ts.ClassElement,
    decorator: ts.Decorator
  ) {
    if (!ts.isPropertyDeclaration(property)) {
      return;
    }
    if (!ts.isIdentifier(property.name)) {
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
    const name = property.name.text;
    litClassContext.litFileContext.nodeReplacements.set(property, undefined);
    litClassContext.reactiveProperties.push({name, options});

    if (property.initializer !== undefined) {
      const factory = this._factory;
      const initializer = factory.createExpressionStatement(
        factory.createBinaryExpression(
          factory.createPropertyAccessExpression(
            factory.createThis(),
            factory.createIdentifier(name)
          ),
          factory.createToken(ts.SyntaxKind.EqualsToken),
          property.initializer
        )
      );
      ts.setTextRange(initializer, property);
      // Omit blank lines from the PreserveBlankLines transformer, because they
      // usually look awkward in the constructor.
      const nonBlankLineSyntheticComments = ts
        .getSyntheticLeadingComments(property)
        ?.filter((comment) => comment.text !== BLANK_LINE_PLACEHOLDER_COMMENT);
      ts.setSyntheticLeadingComments(
        initializer,
        nonBlankLineSyntheticComments
      );
      litClassContext.extraConstructorStatements.push(initializer);
    }
  }

  protected _augmentOptions(
    options: ts.ObjectLiteralExpression
  ): ts.ObjectLiteralExpression {
    return options;
  }
}
