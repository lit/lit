/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';

import type {LitElementMutations} from '../mutations.js';

/**
 * Transform:
 *
 *   @property({type: Number})
 *   foo
 *
 * Into:
 *
 *   static get properties() {
 *     return {
 *       foo: {type: Number}
 *     }
 *   }
 */
export class PropertyVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'property';

  constructor(_context: ts.TransformationContext) {}

  visit(
    mutations: LitElementMutations,
    property: ts.ClassElement,
    decorator: ts.Decorator
  ) {
    if (!ts.isPropertyDeclaration(property)) {
      return;
    }
    if (!ts.isCallExpression(decorator.expression)) {
      return;
    }
    const [options] = decorator.expression.arguments;
    if (!(options === undefined || ts.isObjectLiteralExpression(options))) {
      return;
    }
    const name = property.name.getText();
    mutations.removeNodes.add(decorator);
    mutations.reactiveProperties.push({name, options});
  }
}
