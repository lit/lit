/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
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
    const isGetter = ts.isGetAccessor(property);
    if (!ts.isPropertyDeclaration(property) && !isGetter) {
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
    const factory = this._factory;

    if (isGetter && property.decorators) {
      // Filter out the current decorator
      let decorators: ts.Decorator[] | undefined = property.decorators.filter(
        (dec) => dec !== decorator
      );

      // If there are no decorators prevent the tslib package from being
      // imported by unassigning the decorators array.
      if (decorators.length === 0) {
        decorators = undefined;
      }

      // Decorators is readonly so clone the property.
      const getterWithoutDecorators = factory.createGetAccessorDeclaration(
        decorators,
        property.modifiers,
        property.name,
        property.parameters,
        property.type,
        property.body
      );

      litClassContext.litFileContext.nodeReplacements.set(
        property,
        getterWithoutDecorators
      );
    } else if (!isGetter) {
      // Delete the member property
      litClassContext.litFileContext.nodeReplacements.set(property, undefined);
    }
    litClassContext.reactiveProperties.push({name, options});

    if (!isGetter && property.initializer !== undefined) {
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
    options: ts.ObjectLiteralExpression | undefined
  ): ts.ObjectLiteralExpression | undefined {
    return options;
  }
}
