/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import type {LitClassContext} from '../lit-class-context.js';
import type {MemberDecoratorVisitor} from '../visitor.js';

/**
 * Transform:
 *
 *   @queryAll('.myInput')
 *   inputs
 *
 * Into:
 *
 *   get inputs() {
 *     return this.renderRoot?.queryAll('.myInput') ?? [];
 *   }
 */
export class QueryAllVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'queryAll';

  private readonly _factory: ts.NodeFactory;

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
    if (!ts.isCallExpression(decorator.expression)) {
      return;
    }
    const [arg0] = decorator.expression.arguments;
    if (arg0 === undefined || !ts.isStringLiteral(arg0)) {
      return;
    }
    if (!ts.isIdentifier(property.name)) {
      return;
    }
    const name = property.name.text;
    const selector = arg0.text;
    litClassContext.litFileContext.replaceAndMoveComments(
      property,
      this._createQueryAllGetter(name, selector)
    );
  }

  private _createQueryAllGetter(name: string, selector: string) {
    const factory = this._factory;
    return factory.createGetAccessorDeclaration(
      undefined,
      factory.createIdentifier(name),
      [],
      undefined,
      factory.createBlock(
        [
          factory.createReturnStatement(
            factory.createBinaryExpression(
              factory.createCallChain(
                factory.createPropertyAccessChain(
                  factory.createPropertyAccessExpression(
                    factory.createThis(),
                    factory.createIdentifier('renderRoot')
                  ),
                  factory.createToken(ts.SyntaxKind.QuestionDotToken),
                  factory.createIdentifier('querySelectorAll')
                ),
                undefined,
                undefined,
                [factory.createStringLiteral(selector)]
              ),
              factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
              factory.createArrayLiteralExpression([], false)
            )
          ),
        ],
        true
      )
    );
  }
}
