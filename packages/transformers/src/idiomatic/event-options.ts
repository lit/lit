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
 *   @eventOptions({once: true}})
 *   _onClick(event) {
 *     console.log('click', event.target);
 *   }
 *
 * Into:
 *
 *   constructor() {
 *     super();
 *     this._onClick = {
 *       handleEvent: (event) => {
 *         console.log('click', event.target);
 *       },
 *       once: true
 *     };
 *   }
 */
export class EventOptionsVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'eventOptions';

  private _factory: ts.NodeFactory;

  constructor({factory}: ts.TransformationContext) {
    this._factory = factory;
  }

  visit(
    mutations: LitElementMutations,
    method: ts.ClassElement,
    decorator: ts.Decorator
  ) {
    if (!ts.isMethodDeclaration(method)) {
      return;
    }
    if (!ts.isCallExpression(decorator.expression)) {
      return;
    }
    if (!method.body) {
      return;
    }
    const [options] = decorator.expression.arguments;
    if (!ts.isObjectLiteralExpression(options)) {
      return;
    }
    const methodName = method.name.getText();
    mutations.removeNodes.add(method);
    mutations.classMembers.push(
      this._createEventOptionsAssignment(
        methodName,
        [...method.parameters],
        method.body,
        [...options.properties]
      )
    );
  }

  private _createEventOptionsAssignment(
    methodName: string,
    methodParams: ts.ParameterDeclaration[],
    methodBody: ts.Block,
    eventOptions: ts.ObjectLiteralElementLike[]
  ) {
    const f = this._factory;
    return f.createPropertyDeclaration(
      undefined,
      undefined,
      f.createIdentifier(methodName),
      undefined,
      undefined,
      f.createObjectLiteralExpression(
        [
          f.createPropertyAssignment(
            f.createIdentifier('handleEvent'),
            f.createArrowFunction(
              undefined,
              undefined,
              methodParams,
              undefined,
              f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
              methodBody
            )
          ),
          ...eventOptions,
        ],
        true
      )
    );
  }
}
