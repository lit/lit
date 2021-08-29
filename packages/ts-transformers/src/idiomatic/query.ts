/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

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
    if (!ts.isStringLiteral(arg0)) {
      return;
    }
    if (!ts.isIdentifier(property.name)) {
      return;
    }
    const name = property.name.text;
    const selector = arg0.text;
    const cache = arg1?.kind === ts.SyntaxKind.TrueKeyword;
    litClassContext.litFileContext.nodeReplacements.set(property, undefined);
    litClassContext.classMembers.push(
      this._createQueryGetter(name, selector, cache)
    );
  }

  private _createQueryGetter(name: string, selector: string, cache: boolean) {
    const f = this._factory;
    const querySelectorCall = f.createBinaryExpression(
      f.createCallChain(
        f.createPropertyAccessChain(
          f.createPropertyAccessExpression(
            f.createThis(),
            f.createIdentifier('renderRoot')
          ),
          f.createToken(ts.SyntaxKind.QuestionDotToken),
          f.createIdentifier('querySelector')
        ),
        undefined,
        undefined,
        [f.createStringLiteral(selector)]
      ),
      f.createToken(ts.SyntaxKind.QuestionQuestionToken),
      f.createNull()
    );
    return f.createGetAccessorDeclaration(
      undefined,
      undefined,
      f.createIdentifier(name),
      [],
      undefined,
      f.createBlock(
        [
          f.createReturnStatement(
            cache
              ? f.createBinaryExpression(
                  f.createPropertyAccessExpression(
                    f.createThis(),
                    f.createIdentifier(`__${name}`)
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
