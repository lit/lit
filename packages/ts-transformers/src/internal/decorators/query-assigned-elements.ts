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
 *   @queryAssignedElements({slotName: 'list', selector: '.item'})
 *   listItems
 *
 * Into:
 *
 *   get listItems() {
 *     return this.renderRoot
 *       ?.querySelector('slot[name=list]')
 *       ?.assignedElements()
 *       ?.filter((node) => node.matches('.item')
 *   }
 */
export class QueryAssignedElementsVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'queryAssignedElements';

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
    if (arg0 && !ts.isObjectLiteralExpression(arg0)) {
      throw new Error(
        `queryAssignedElements argument is expected to be an inlined ` +
          `object literal. Instead received: '${arg0.getText()}'`
      );
    }
    if (arg0 && arg0.properties.some((p) => !ts.isPropertyAssignment(p))) {
      throw new Error(
        `queryAssignedElements object literal argument can only include ` +
          `property assignment. For example: '{ slotName: "example" }' is ` +
          `supported, whilst '{ ...otherOpts }' is unsupported.`
      );
    }
    const {slotName, selector} = this._retrieveSlotAndSelector(arg0);
    litClassContext.litFileContext.replaceAndMoveComments(
      property,
      this._createQueryAssignedElementsGetter(
        name,
        slotName,
        selector,
        this._filterAssignedElementsOptions(arg0)
      )
    );
  }

  private _retrieveSlotAndSelector(opts?: ts.ObjectLiteralExpression): {
    slotName: string;
    selector: string;
  } {
    if (!opts) {
      return {slotName: '', selector: ''};
    }
    const findStringLiteralFor = (key: string): string => {
      const propAssignment = opts.properties.find(
        (p) => p.name && ts.isIdentifier(p.name) && p.name.text === key
      );
      if (!propAssignment) {
        return '';
      }
      if (
        propAssignment &&
        ts.isPropertyAssignment(propAssignment) &&
        ts.isStringLiteral(propAssignment.initializer)
      ) {
        return propAssignment.initializer.text;
      }
      throw new Error(
        `queryAssignedElements object literal property '${key}' must be a ` +
          `string literal.`
      );
    };
    return {
      slotName: findStringLiteralFor('slotName'),
      selector: findStringLiteralFor('selector'),
    };
  }

  /**
   * queryAssignedElements options contains a superset of the options that
   * `HTMLSlotElement.assignedElements` accepts. This method takes the original
   * optional options passed into `queryAssignedElements` and filters out any
   * decorator specific property assignments.
   *
   * Given:
   *
   * ```ts
   * { slotName: 'example', flatten: false }
   * ```
   *
   * returns:
   *
   * ```ts
   * { flatten: false }
   * ```
   *
   * Returns `undefined` instead of an empty object literal if no property
   * assignments are left after filtering, such that we don't generate code
   * like `HTMLSlotElement.assignedElements({})`.
   */
  private _filterAssignedElementsOptions(
    opts?: ts.ObjectLiteralExpression
  ): ts.ObjectLiteralExpression | undefined {
    if (!opts) {
      return;
    }
    const assignedElementsProperties = opts.properties.filter(
      (p) =>
        p.name &&
        ts.isIdentifier(p.name) &&
        !['slotName', 'selector'].includes(p.name.text)
    );
    if (assignedElementsProperties.length === 0) {
      return;
    }
    return this._factory.updateObjectLiteralExpression(
      opts,
      assignedElementsProperties
    );
  }

  private _createQueryAssignedElementsGetter(
    name: string,
    slotName: string,
    selector: string,
    assignedElsOptions?: ts.ObjectLiteralExpression
  ) {
    const factory = this._factory;

    const slotSelector = `slot${
      slotName ? `[name=${slotName}]` : ':not([name])'
    }`;

    const assignedElementsOptions = assignedElsOptions
      ? [assignedElsOptions]
      : [];

    // this.renderRoot?.querySelector(<selector>)?.assignedElements(<options>)
    const assignedElements = factory.createCallChain(
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
        factory.createIdentifier('assignedElements')
      ),
      undefined,
      undefined,
      assignedElementsOptions
    );

    const returnExpression = !selector
      ? assignedElements
      : // <assignedElements>?.filter((node) => node.matches(<selector>))
        factory.createCallChain(
          factory.createPropertyAccessChain(
            assignedElements,
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
              factory.createCallExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('node'),
                  factory.createIdentifier('matches')
                ),
                undefined,
                [factory.createStringLiteral(selector)]
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
