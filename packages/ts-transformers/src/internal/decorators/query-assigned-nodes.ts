/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import {QueryAssignedElementsVisitor} from './query-assigned-elements.js';

import type {LitClassContext} from '../lit-class-context.js';

/**
 * Transform:
 *
 *   @queryAssignedNodes({slot: 'list'})
 *   listItems
 *
 * Into:
 *
 *   get listItems() {
 *     return this.renderRoot
 *       ?.querySelector('slot[name=list]')
 *       ?.assignedNodes() ?? [];
 *   }
 *
 * Falls back on transforming the legacy queryAssignedNodes API.
 */
export class QueryAssignedNodesVisitor extends QueryAssignedElementsVisitor {
  override readonly decoratorName = 'queryAssignedNodes';
  override slottedQuery = 'assignedNodes';

  private readonly legacyVisitor: QueryAssignedLegacyNodesVisitor;

  constructor(context: ts.TransformationContext) {
    super(context);
    this.legacyVisitor = new QueryAssignedLegacyNodesVisitor(context);
  }

  override visit(
    litClassContext: LitClassContext,
    property: ts.ClassElement,
    decorator: ts.Decorator
  ) {
    if (this.legacyVisitor.visit(litClassContext, property, decorator)) {
      return;
    }
    super.visit(litClassContext, property, decorator);
  }
}

class QueryAssignedLegacyNodesVisitor {
  private readonly _factory: ts.NodeFactory;

  constructor({factory}: ts.TransformationContext) {
    this._factory = factory;
  }

  /**
   * Modified `visit` to keep support for the deprecated legacy
   * `queryAssignedNodes` decorator. Returns a boolean to notify if it was
   * successfully applied.
   */
  visit(
    litClassContext: LitClassContext,
    property: ts.ClassElement,
    decorator: ts.Decorator
  ): boolean {
    if (!ts.isPropertyDeclaration(property)) {
      return false;
    }
    if (!ts.isCallExpression(decorator.expression)) {
      return false;
    }
    if (!ts.isIdentifier(property.name)) {
      return false;
    }
    const name = property.name.text;
    const [arg0, arg1, arg2] = decorator.expression.arguments;
    if (arg0 && !ts.isStringLiteral(arg0)) {
      // Detection for new queryAssignedNodes API.
      return false;
    }
    const slotName =
      arg0 !== undefined && ts.isStringLiteral(arg0) ? arg0.text : '';
    const flatten = arg1?.kind === ts.SyntaxKind.TrueKeyword;
    const selector =
      arg2 !== undefined && ts.isStringLiteral(arg2) ? arg2.text : '';
    litClassContext.litFileContext.replaceAndMoveComments(
      property,
      this._createQueryAssignedNodesGetter(name, slotName, flatten, selector)
    );
    return true;
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
