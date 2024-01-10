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
 *   @queryAssignedElements({slot: 'list', selector: '.item'})
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
  decoratorName = 'queryAssignedElements';

  /**
   * The method used to query the HTMLSlot element.
   */
  protected slottedQuery = 'assignedElements';
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
        `${this.decoratorName} argument is expected to be an inlined ` +
          `object literal. Instead received: '${arg0.getText()}'`
      );
    }
    if (
      arg0 &&
      arg0.properties.some(
        (p) =>
          !(ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p))
      )
    ) {
      throw new Error(
        `${this.decoratorName} object literal argument can only include ` +
          `property assignment. For example: '{ slot: "example" }' is ` +
          `supported, whilst '{ ...otherOpts }' is unsupported.`
      );
    }
    const {slot, selector} = this._retrieveSlotAndSelector(arg0);
    litClassContext.litFileContext.replaceAndMoveComments(
      property,
      this._createQueryAssignedGetter({
        name,
        slot,
        selector,
        assignedElsOptions: this._filterAssignedOptions(arg0),
      })
    );
  }

  /**
   * @param opts object literal node passed into the queryAssignedElements decorator
   * @returns expression nodes for the slot and selector.
   */
  private _retrieveSlotAndSelector(opts?: ts.ObjectLiteralExpression): {
    slot?: ts.Expression;
    selector?: ts.Expression;
  } {
    if (!opts) {
      return {};
    }
    const findExpressionFor = (key: string): ts.Expression | undefined => {
      const propAssignment = opts.properties.find(
        (p) => p.name && ts.isIdentifier(p.name) && p.name.text === key
      );
      if (!propAssignment) {
        return;
      }
      if (ts.isPropertyAssignment(propAssignment)) {
        return propAssignment.initializer;
      }
      if (ts.isShorthandPropertyAssignment(propAssignment)) {
        return propAssignment.name;
      }
      return;
    };
    return {
      slot: findExpressionFor('slot'),
      selector: findExpressionFor('selector'),
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
   * { slot: 'example', flatten: false }
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
  private _filterAssignedOptions(
    opts?: ts.ObjectLiteralExpression
  ): ts.ObjectLiteralExpression | undefined {
    if (!opts) {
      return;
    }
    const assignedElementsProperties = opts.properties.filter(
      (p) =>
        p.name &&
        ts.isIdentifier(p.name) &&
        !['slot', 'selector'].includes(p.name.text)
    );
    if (assignedElementsProperties.length === 0) {
      return;
    }
    return this._factory.updateObjectLiteralExpression(
      opts,
      assignedElementsProperties
    );
  }

  private _createQueryAssignedGetter({
    name,
    slot,
    selector,
    assignedElsOptions,
  }: {
    name: string;
    slot?: ts.Expression;
    selector?: ts.Expression;
    assignedElsOptions?: ts.ObjectLiteralExpression;
  }) {
    const factory = this._factory;

    const slotSelector = slot
      ? this.createNamedSlotSelector(slot)
      : this.createDefaultSlotSelector();

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
          [slotSelector]
        ),
        factory.createToken(ts.SyntaxKind.QuestionDotToken),
        factory.createIdentifier(this.slottedQuery)
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
                  factory.createIdentifier('node')
                ),
              ],
              undefined,
              factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              this.getSelectorFilter(selector)
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
      factory.createIdentifier(name),
      [],
      undefined,
      getterBody
    );
  }

  /**
   * @param selector User supplied CSS selector.
   * @returns Expression used to filter the queried Elements.
   */
  protected getSelectorFilter(selector: ts.Expression): ts.Expression {
    const factory = this._factory;
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('node'),
        factory.createIdentifier('matches')
      ),
      undefined,
      [selector]
    );
  }

  /**
   * Returns a template string which resolves the passed in slot name
   * expression.
   *
   * Special handling is included for string literals and no substitution
   * template literals. In this case we inline the slot name into the selector
   * to match what is more likely to have been authored.
   *
   * @param slot Expression that evaluates to the slot name.
   * @returns Template string node representing `slot[name=${slot}]` except when
   *   `slot` is a string literal. Then the literal is inlined. I.e. for a slot
   *   expression of `"list"`, return `slot[name=list]`.
   */
  private createNamedSlotSelector(slot: ts.Expression) {
    const factory = this._factory;
    if (ts.isStringLiteral(slot) || ts.isNoSubstitutionTemplateLiteral(slot)) {
      const inlinedSlotSelector = `slot[name=${slot.text}]`;
      return this._factory.createNoSubstitutionTemplateLiteral(
        inlinedSlotSelector,
        inlinedSlotSelector
      );
    }
    return factory.createTemplateExpression(
      factory.createTemplateHead('slot[name=', 'slot[name='),
      [factory.createTemplateSpan(slot, factory.createTemplateTail(']', ']'))]
    );
  }

  /**
   * @returns Template string node representing `slot:not([name])`
   */
  private createDefaultSlotSelector() {
    return this._factory.createNoSubstitutionTemplateLiteral(
      'slot:not([name])',
      'slot:not([name])'
    );
  }
}
