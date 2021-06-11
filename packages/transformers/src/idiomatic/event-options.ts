/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {cloneNode} from 'ts-clone-node';

import type {LitElementMutations} from '../mutations.js';
import type {MemberDecoratorVisitor, GenericVisitor} from '../visitor.js';

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
export class EventOptionsVisitor implements MemberDecoratorVisitor {
  readonly kind = 'memberDecorator';
  readonly decoratorName = 'eventOptions';

  private _factory: ts.NodeFactory;
  private _typeChecker: ts.TypeChecker;

  constructor(
    {factory}: ts.TransformationContext,
    typeChecker: ts.TypeChecker
  ) {
    this._factory = factory;
    this._typeChecker = typeChecker;
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
    if (!ts.isIdentifier(method.name)) {
      return;
    }
    if (
      method.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.PrivateKeyword)
    ) {
      const methodSymbol = this._typeChecker.getSymbolAtLocation(method.name);
      if (methodSymbol !== undefined) {
        mutations.removeNodes.add(decorator);
        mutations.visitors.add(
          new EventOptionsBindingVisitor(
            this._factory,
            this._typeChecker,
            methodSymbol,
            options
          )
        );
        return;
      }
    }
    const methodName = method.name.text;
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

class EventOptionsBindingVisitor implements GenericVisitor {
  readonly kind = 'generic';

  private _factory: ts.NodeFactory;
  private _symbol: ts.Symbol;
  private _typeChecker: ts.TypeChecker;
  private _optionsNode: ts.ObjectLiteralExpression;

  constructor(
    factory: ts.NodeFactory,
    typeChecker: ts.TypeChecker,
    methodSymbol: ts.Symbol,
    optionsNode: ts.ObjectLiteralExpression
  ) {
    this._factory = factory;
    this._typeChecker = typeChecker;
    this._symbol = methodSymbol;
    this._optionsNode = optionsNode;
  }

  visit(node: ts.Node): ts.Node {
    if (!ts.isPropertyAccessExpression(node)) {
      return node;
    }
    const symbol = this._typeChecker.getSymbolAtLocation(node.name);
    if (symbol !== this._symbol) {
      return node;
    }
    return this._createEventHandlerObject(node);
  }

  private _createEventHandlerObject(
    node: ts.PropertyAccessExpression
  ): ts.ObjectLiteralExpression {
    const f = this._factory;
    return f.createObjectLiteralExpression(
      [
        f.createPropertyAssignment(
          f.createIdentifier('handleEvent'),
          f.createArrowFunction(
            undefined,
            undefined,
            [
              f.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                f.createIdentifier('e'),
                undefined,
                undefined,
                undefined
              ),
            ],
            undefined,
            f.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            f.createCallExpression(cloneNode(node), undefined, [
              f.createIdentifier('e'),
            ])
          )
        ),
        ...this._optionsNode.properties.map((property) => cloneNode(property)),
      ],
      false
    );
  }
}
