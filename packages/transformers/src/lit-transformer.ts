/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {LitElementMutations} from './mutations.js';

import type {
  Visitor,
  ClassDecoratorVisitor,
  MemberDecoratorVisitor,
  GenericVisitor,
} from './visitor.js';

const unreachable = (x: never) => x;

/**
 * Configurable transformer for LitElement classes.
 */
export class LitTransformer {
  private _typeChecker: ts.TypeChecker;
  private _context: ts.TransformationContext;
  private _classDecoratorVisitors = new MultiMap<
    string,
    ClassDecoratorVisitor
  >();
  private _memberDecoratorVisitors = new MultiMap<
    string,
    MemberDecoratorVisitor
  >();
  private _genericVisitors = new Set<GenericVisitor>();
  private _importedLitDecorators = new Map<ts.Node, string>();
  private _removeNodes = new Set<ts.Node>();

  constructor(
    program: ts.Program,
    context: ts.TransformationContext,
    visitors: Array<Visitor>
  ) {
    this._typeChecker = program.getTypeChecker();
    this._context = context;
    for (const visitor of visitors) {
      this._registerVisitor(visitor);
    }
  }

  private _registerVisitor(visitor: Visitor) {
    switch (visitor.kind) {
      case 'classDecorator': {
        this._classDecoratorVisitors.add(visitor.decoratorName, visitor);
        break;
      }
      case 'memberDecorator': {
        this._memberDecoratorVisitors.add(visitor.decoratorName, visitor);
        break;
      }
      case 'generic': {
        this._genericVisitors.add(visitor);
        break;
      }
      default: {
        throw new Error(
          `Internal error: registering unknown visitor kind ${
            (unreachable(visitor) as Visitor).kind
          }`
        );
      }
    }
  }

  private _unregisterVisitor(visitor: Visitor) {
    switch (visitor.kind) {
      case 'classDecorator': {
        this._classDecoratorVisitors.delete(visitor.decoratorName, visitor);
        break;
      }
      case 'memberDecorator': {
        this._memberDecoratorVisitors.delete(visitor.decoratorName, visitor);
        break;
      }
      case 'generic': {
        this._genericVisitors.delete(visitor);
        break;
      }
      default: {
        throw new Error(
          `Internal error: unregistering unknown visitor kind ${
            (unreachable(visitor) as Visitor).kind
          }`
        );
      }
    }
  }

  visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (ts.isSourceFile(node)) {
      // New file, new imports.
      this._importedLitDecorators.clear();
      this._removeNodes.clear();
    }
    if (this._removeNodes.delete(node)) {
      return undefined;
    }
    for (const visitor of this._genericVisitors) {
      node = visitor.visit(node);
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
    // Check if this is one of the many modules that export Lit decorators.
    const specifier = ts.isStringLiteral(node.moduleSpecifier)
      ? node.moduleSpecifier.text
      : '';
    if (
      !(
        specifier.startsWith('lit/decorators') ||
        specifier.startsWith('lit-element/decorators') ||
        specifier.startsWith('@lit/reactive-element/decorators') ||
        specifier === 'lit-element' ||
        specifier === 'lit-element/index.js' ||
        specifier === 'lit-element/index'
      )
    ) {
      return node;
    }

    // TODO(aomarks) Maybe handle NamespaceImport (import * as decorators).
    const bindings = node.importClause?.namedBindings;
    if (bindings == undefined || !ts.isNamedImports(bindings)) {
      return node;
    }

    let importsNeedPruning = false;
    for (const importSpecifier of bindings.elements) {
      // Name as exported (Lit's name for it, not whatever the alias is).
      const realName =
        importSpecifier.propertyName?.text ?? importSpecifier.name.text;
      if (
        // Only handle the decorators we're configured to transform.
        this._classDecoratorVisitors.has(realName) ||
        this._memberDecoratorVisitors.has(realName)
      ) {
        this._importedLitDecorators.set(importSpecifier, realName);
        this._removeNodes.add(importSpecifier);
        importsNeedPruning = true;
      }
    }

    if (importsNeedPruning) {
      const pruned = ts.visitEachChild(node, this.visit, this._context);
      return (pruned.importClause?.namedBindings as ts.NamedImports).elements
        .length > 0
        ? pruned
        : // Remove the import altogether if there are no remaining bindings.
          undefined;
    }

    return node;
  }

  private _identifyImportedLitDecorator(
    decorator: ts.Decorator
  ): string | undefined {
    if (ts.isCallExpression(decorator.expression)) {
      const symbol = this._typeChecker.getSymbolAtLocation(
        decorator.expression.expression
      );
      const firstDeclaration = symbol?.declarations[0];
      if (firstDeclaration !== undefined) {
        return this._importedLitDecorators.get(firstDeclaration);
      }
    }
    return undefined;
  }

  private _visitClassDeclaration(class_: ts.ClassDeclaration) {
    const mutations = new LitElementMutations();

    // Class decorators
    for (const decorator of class_.decorators ?? []) {
      const decoratorName = this._identifyImportedLitDecorator(decorator);
      if (decoratorName !== undefined) {
        const visitors = this._classDecoratorVisitors.get(decoratorName) ?? [];
        for (const visitor of visitors) {
          visitor.visit(mutations, class_, decorator);
        }
      }
    }

    // Class member decorators
    for (const member of class_.members ?? []) {
      for (const decorator of member.decorators ?? []) {
        const decoratorName = this._identifyImportedLitDecorator(decorator);
        if (decoratorName !== undefined) {
          const visitors =
            this._memberDecoratorVisitors.get(decoratorName) ?? [];
          for (const visitor of visitors) {
            visitor.visit(mutations, member, decorator);
          }
        }
      }
    }

    if (mutations.reactiveProperties.length > 0) {
      const existing = this._findExistingStaticProperties(class_);
      if (existing !== undefined) {
        this._removeNodes.add(existing.getter);
      }
      mutations.classMembers.unshift(
        this._createStaticProperties(
          existing?.properties,
          mutations.reactiveProperties
        )
      );
    }

    // Note `mutations.nodesToRemove` is scoped only to this class visitor, so
    // we copy the entries to this broader AST scoped visitor so that we can
    // identify nodes to delete as we descend down through `ts.visitEachChild`.
    for (const node of mutations.removeNodes) {
      this._removeNodes.add(node);
    }

    for (const visitor of mutations.visitors) {
      this._registerVisitor(visitor);
    }

    // Note we do need to `ts.visitEachChild` here, because [1] there might be
    // nodes that still need to be deleted via `this._nodesToRemove` (e.g. a
    // property decorator or a property itself), and [2] in theory there could
    // be a nested custom element definition somewhere in this class.
    const transformedClass = ts.visitEachChild(
      this._context.factory.updateClassDeclaration(
        class_,
        class_.decorators,
        class_.modifiers,
        class_.name,
        class_.typeParameters,
        class_.heritageClauses,
        [...mutations.classMembers, ...class_.members]
      ),
      this.visit,
      this._context
    );

    // These visitors only apply within the scope of the current class.
    for (const visitor of mutations.visitors) {
      this._unregisterVisitor(visitor);
    }

    return [transformedClass, ...mutations.adjacentStatements];
  }

  /**
   * Create the AST from e.g. `@property({type: String}) myProperty`:
   *
   *   static get properties() {
   *     return {
   *       myProperty: { type: String },
   *       ...
   *     }
   *   }
   */
  private _createStaticProperties(
    existingProperties: ts.NodeArray<ts.ObjectLiteralElementLike> | undefined,
    newProperties: Array<{name: string; options?: ts.ObjectLiteralExpression}>
  ) {
    const f = this._context.factory;
    const properties = [
      // TODO(aomarks) existingProperties should be cloned.
      ...(existingProperties ?? []),
      ...newProperties.map(({name, options}) =>
        f.createPropertyAssignment(
          f.createIdentifier(name),
          options ? options : f.createObjectLiteralExpression([], false)
        )
      ),
    ];
    return f.createGetAccessorDeclaration(
      undefined,
      [f.createModifier(ts.SyntaxKind.StaticKeyword)],
      f.createIdentifier('properties'),
      [],
      undefined,
      f.createBlock(
        [
          f.createReturnStatement(
            f.createObjectLiteralExpression(properties, true)
          ),
        ],
        true
      )
    );
  }

  private _findExistingStaticProperties(class_: ts.ClassDeclaration):
    | {
        getter: ts.ClassElement;
        properties: ts.NodeArray<ts.ObjectLiteralElementLike>;
      }
    | undefined {
    const getter = class_.members.find(
      (member) =>
        ts.isGetAccessor(member) &&
        ts.isIdentifier(member.name) &&
        member.name.text === 'properties'
    );
    if (
      getter === undefined ||
      !ts.isGetAccessorDeclaration(getter) ||
      getter.body === undefined
    ) {
      return undefined;
    }
    const returnStatement = getter.body.statements[0];
    if (
      returnStatement === undefined ||
      !ts.isReturnStatement(returnStatement)
    ) {
      return undefined;
    }
    const objectLiteral = returnStatement.expression;
    if (
      objectLiteral === undefined ||
      !ts.isObjectLiteralExpression(objectLiteral)
    ) {
      return undefined;
    }
    return {getter, properties: objectLiteral.properties};
  }
}

/**
 * Maps from a key to a Set of values.
 */
class MultiMap<K, V> {
  private readonly _map = new Map<K, Set<V>>();

  get(key: K): Set<V> | undefined {
    return this._map.get(key);
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  get size(): number {
    return this._map.size;
  }

  add(key: K, val: V) {
    let set = this._map.get(key);
    if (set === undefined) {
      set = new Set();
      this._map.set(key, set);
    }
    set.add(val);
  }

  delete(key: K, val: V) {
    const set = this._map.get(key);
    if (set === undefined) {
      return;
    }
    if (set.delete(val) && set.size === 0) {
      this._map.delete(key);
    }
  }
}
