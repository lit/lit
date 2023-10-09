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
 *   @queryAsync('#myButton')
 *   button
 *
 * Into:
 *
 *   get button() {
 *     return this.updateComplete.then(
 *       () => this.renderRoot.querySelector('#myButton'));
 *   }
 */
export class QueryAsyncVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'queryAsync';

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
      this._createQueryAsyncGetter(name, selector)
    );
  }

  private _createQueryAsyncGetter(name: string, selector: string) {
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
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createPropertyAccessExpression(
                        factory.createThis(),
                        factory.createIdentifier('renderRoot')
                      ),
                      factory.createIdentifier('querySelector')
                    ),
                    undefined,
                    [factory.createStringLiteral(selector)]
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
