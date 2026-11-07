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
 *   @queryAsyncAll('.myInput')
 *   inputs
 *
 * Into:
 *
 *   get inputs() {
 *     return this.updateComplete.then(
 *       () => this.renderRoot?.querySelectorAll('.myInput') ?? []);
 *   }
 */
export class QueryAsyncAllVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'queryAsyncAll';

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
    if (!ts.isIdentifier(property.name)) {
      return;
    }
    const name = property.name.text;
    const [arg0] = decorator.expression.arguments;
    if (arg0 === undefined || !ts.isStringLiteral(arg0)) {
      return;
    }
    const selector = arg0.text;
    litClassContext.litFileContext.replaceAndMoveComments(
      property,
      this._createQueryAsyncAllGetter(name, selector)
    );
  }

  private _createQueryAsyncAllGetter(name: string, selector: string) {
    const factory = this._factory;
    return factory.createGetAccessorDeclaration(
      undefined,
      factory.createIdentifier(name),
      [],
      undefined,
      factory.createBlock(
        [
          factory.createReturnStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createThis(),
                  factory.createIdentifier('updateComplete')
                ),
                factory.createIdentifier('then')
              ),
              undefined,
              [
                factory.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
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
              ]
            )
          ),
        ],
        true
      )
    );
  }
}
