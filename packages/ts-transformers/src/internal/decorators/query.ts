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
 *   @query('#myDiv')
 *   div
 *
 *   @query('#mySpan', true)
 *   span
 *
 * Into:
 *
 *   get div() {
 *     return this.renderRoot?.querySelector('#myDiv');
 *   }
 *
 *   get span() {
 *     return this.__span ??= this.renderRoot?.querySelector('#myDiv') ?? null;
 *   }
 */
export class QueryVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'query';

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
    const [arg0, arg1] = decorator.expression.arguments;
    if (arg0 === undefined || !ts.isStringLiteral(arg0)) {
      return;
    }
    if (!ts.isIdentifier(property.name)) {
      return;
    }
    const name = property.name.text;
    const selector = arg0.text;
    const cache = arg1?.kind === ts.SyntaxKind.TrueKeyword;
    litClassContext.litFileContext.replaceAndMoveComments(
      property,
      this._createQueryGetter(name, selector, cache)
    );
  }

  private _createQueryGetter(name: string, selector: string, cache: boolean) {
    const factory = this._factory;
    const querySelectorCall = factory.createBinaryExpression(
      factory.createCallChain(
        factory.createPropertyAccessChain(
          factory.createPropertyAccessExpression(
            factory.createThis(),
            factory.createIdentifier('renderRoot')
          ),
          factory.createToken(ts.SyntaxKind.QuestionDotToken),
          factory.createIdentifier('querySelector')
        ),
        undefined,
        undefined,
        [factory.createStringLiteral(selector)]
      ),
      factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
      factory.createNull()
    );
    return factory.createGetAccessorDeclaration(
      undefined,
      factory.createIdentifier(name),
      [],
      undefined,
      factory.createBlock(
        [
          factory.createReturnStatement(
            cache
              ? factory.createBinaryExpression(
                  factory.createPropertyAccessExpression(
                    factory.createThis(),
                    factory.createIdentifier(`__${name}`)
                  ),
                  ts.SyntaxKind.QuestionQuestionEqualsToken,
                  querySelectorCall
                )
              : querySelectorCall
          ),
        ],
        true
      )
    );
  }
}
