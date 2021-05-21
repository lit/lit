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
 *   @customElement('my-element')
 *   class MyElement extends HTMLElement {}
 *
 * Into:
 *
 *   class MyElement extends HTMLElement {}
 *   customElements.define('my-element', MyElement)
 */
export class CustomElementVisitor {
  readonly kind = 'classDecorator';
  readonly decoratorName = 'customElement';

  private _factory: ts.NodeFactory;

  constructor({factory}: ts.TransformationContext) {
    this._factory = factory;
  }

  visit(
    mutations: LitElementMutations,
    class_: ts.ClassDeclaration,
    decorator: ts.Decorator
  ) {
    if (!class_.name) {
      return;
    }
    if (!ts.isCallExpression(decorator.expression)) {
      return;
    }
    const [arg0] = decorator.expression.arguments;
    if (!ts.isStringLiteral(arg0)) {
      return;
    }
    const elementName = arg0.text;
    const className = class_.name.getText();
    mutations.removeNodes.add(decorator);
    mutations.adjacentStatements.push(
      this._createCustomElementsDefineCall(elementName, className)
    );
  }

  private _createCustomElementsDefineCall(
    elementName: string,
    className: string
  ) {
    const f = this._factory;
    return f.createExpressionStatement(
      f.createCallExpression(
        f.createPropertyAccessExpression(
          f.createIdentifier('customElements'),
          f.createIdentifier('define')
        ),
        undefined,
        [f.createStringLiteral(elementName), f.createIdentifier(className)]
      )
    );
  }
}
