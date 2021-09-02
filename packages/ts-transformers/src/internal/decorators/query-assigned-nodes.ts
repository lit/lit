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
 *   @queryAssignedNodes('list')
 *   listItems
 *
 * Into:
 *
 *   get listItems() {
 *     return this.renderRoot
 *       ?.querySelector('slot[name=list]')
 *       ?.assignedNodes() ?? [];
 *   }
 */
export class QueryAssignedNodesVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'queryAssignedNodes';

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
    const [arg0, arg1, arg2] = decorator.expression.arguments;
    const slotName =
      arg0 !== undefined && ts.isStringLiteral(arg0) ? arg0.text : '';
    const flatten = arg1?.kind === ts.SyntaxKind.TrueKeyword;
    const selector =
      arg2 !== undefined && ts.isStringLiteral(arg2) ? arg2.text : '';
    litClassContext.litFileContext.replaceAndMoveComments(
      property,
      this._createQueryAssignedNodesGetter(name, slotName, flatten, selector)
    );
  }

  private _createQueryAssignedNodesGetter(
    name: string,
    slotName: string,
    flatten: boolean,
    selector: string
  ) {
    const factory = this._factory;

    const slotSelector = `slot${
      slotName ? `[name=${slotName}]` : ':not([name])'
    }`;

    // {flatten: true}
    const assignedNodesOptions = flatten
      ? [
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                factory.createIdentifier('flatten'),
                factory.createTrue()
              ),
            ],
            false
          ),
        ]
      : [];

    // this.renderRoot?.querySelector(<selector>)?.assignedNodes(<options>)
    const assignedNodes = factory.createCallChain(
      factory.createPropertyAccessChain(
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
          [factory.createStringLiteral(slotSelector)]
        ),
        factory.createToken(ts.SyntaxKind.QuestionDotToken),
        factory.createIdentifier('assignedNodes')
      ),
      undefined,
      undefined,
      assignedNodesOptions
    );

    const returnExpression = !selector
      ? assignedNodes
      : // <assignedNodes>?.filter((node) =>
        //   node.nodeType === Node.ELEMENT_NODE &&
        //     node.matches(<selector>)
        factory.createCallChain(
          factory.createPropertyAccessChain(
            assignedNodes,
            factory.createToken(ts.SyntaxKind.QuestionDotToken),
            factory.createIdentifier('filter')
          ),
          undefined,
          undefined,
          [
            factory.createArrowFunction(
              undefined,
              undefined,
              [
                factory.createParameterDeclaration(
                  undefined,
                  undefined,
                  undefined,
                  factory.createIdentifier('node'),
                  undefined,
                  undefined,
                  undefined
                ),
              ],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              factory.createBinaryExpression(
                factory.createBinaryExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('node'),
                    factory.createIdentifier('nodeType')
                  ),
                  factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('Node'),
                    factory.createIdentifier('ELEMENT_NODE')
                  )
                ),
                factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('node'),
                    factory.createIdentifier('matches')
                  ),
                  undefined,
                  [factory.createStringLiteral(selector)]
                )
              )
            ),
          ]
        );

    // { return <returnExpression> }
    const getterBody = factory.createBlock(
      [
        factory.createReturnStatement(
          factory.createBinaryExpression(
            returnExpression,
            factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
            factory.createArrayLiteralExpression([], false)
          )
        ),
      ],
      true
    );

    return factory.createGetAccessorDeclaration(
      undefined,
      undefined,
      factory.createIdentifier(name),
      [],
      undefined,
      getterBody
    );
  }
}
