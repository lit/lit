/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {LitElementMutations} from './mutations.js';

type Visitor = ClassDecoratorTransformer;

interface ClassDecoratorTransformer {
  kind: 'classDecorator';
  decoratorName: string;

  visit(
    mutations: LitElementMutations,
    class_: ts.ClassDeclaration,
    decorator: ts.Decorator
  ): void;
}

/**
 * Configurable transformer for LitElement classes.
 */
export class LitTransformer {
  private _context: ts.TransformationContext;

  private _classDecoratorVisitors = new Map<
    string,
    ClassDecoratorTransformer[]
  >();

  private _removeNodes = new Set<ts.Node>();

  constructor(context: ts.TransformationContext, visitors: Array<Visitor>) {
    this._context = context;
    for (const visitor of visitors) {
      if (visitor.kind === 'classDecorator') {
        let arr = this._classDecoratorVisitors.get(visitor.decoratorName);
        if (arr === undefined) {
          arr = [];
          this._classDecoratorVisitors.set(visitor.decoratorName, arr);
        }
        arr.push(visitor);
      } else {
        throw new Error(`Internal error: unknown visitor kind ${visitor.kind}`);
      }
    }
  }

  visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (this._removeNodes.delete(node)) {
      return undefined;
    }
    if (ts.isImportDeclaration(node)) {
      return this._visitImportDeclaration(node);
    }
    if (ts.isClassDeclaration(node)) {
      return this._visitClassDeclaration(node);
    }
    return ts.visitEachChild(node, this.visit, this._context);
  };

  private _visitImportDeclaration(node: ts.ImportDeclaration) {
    if (
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === 'lit/decorators.js'
    ) {
      return undefined;
    }
    return node;
  }

  private _visitClassDeclaration(class_: ts.ClassDeclaration) {
    const mutations = new LitElementMutations();

    // Class decorators
    for (const decorator of class_.decorators ?? []) {
      if (
        !ts.isCallExpression(decorator.expression) ||
        !ts.isIdentifier(decorator.expression.expression)
      ) {
        continue;
      }
      const decoratorName = decorator.expression.expression.getText();
      const visitors = this._classDecoratorVisitors.get(decoratorName) ?? [];
      for (const visitor of visitors) {
        visitor.visit(mutations, class_, decorator);
      }
    }

    // Note `mutations.nodesToRemove` is scoped only to this class visitor, so
    // we copy the entries to this broader AST scoped visitor so that we can
    // identify nodes to delete as we descend down through `ts.visitEachChild`.
    for (const node of mutations.removeNodes) {
      this._removeNodes.add(node);
    }

    // Note we do need to `ts.visitEachChild` here, because [1] there might be
    // nodes that still need to be deleted via `this._nodesToRemove` (e.g. a
    // property decorator or a property itself), and [2] in theory there could
    // be a nested custom element definition somewhere in this class.
    const transformedClass = ts.visitEachChild(
      class_,
      this.visit,
      this._context
    );

    return [transformedClass, ...mutations.adjacentStatements];
  }
}
