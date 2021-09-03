/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';

import type {LitClassContext} from '../lit-class-context.js';
import type {ClassDecoratorVisitor} from '../visitor.js';

/**
 * Transform:
 *
 *   import {localized} from '@lit/localize';
 *
 *   @localized()
 *   class MyElement extends LitElement {}
 *
 * Into:
 *
 *   import {updateWhenLocaleChanges} from '@lit/localize';
 *
 *   class MyElement extends LitElement {
 *     constructor() {
 *       super(...arguments);
 *       updateWhenLocaleChanges(this);
 *     }
 *   }
 */
export class LocalizedVisitor implements ClassDecoratorVisitor {
  readonly kind = 'classDecorator';
  readonly decoratorName = 'localized';
  readonly importBindingReplacement = 'updateWhenLocaleChanges';

  private readonly _factory: ts.NodeFactory;

  constructor({factory}: ts.TransformationContext) {
    this._factory = factory;
  }

  visit(litClassContext: LitClassContext, decorator: ts.Decorator) {
    litClassContext.litFileContext.nodeReplacements.set(decorator, undefined);

    const factory = this._factory;
    const updateCall = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createIdentifier(this.importBindingReplacement),
        undefined,
        [factory.createThis()]
      )
    );
    litClassContext.extraConstructorStatements.push(updateCall);
  }
}
