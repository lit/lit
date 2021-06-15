/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {LitClassContext} from './lit-class-context.js';
import {LitFileContext} from './lit-file-context.js';
import {cloneNode} from 'ts-clone-node';

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
  private readonly _program: ts.Program;
  private readonly _context: ts.TransformationContext;
  private readonly _classDecoratorVisitors = new MultiMap<
    string,
    ClassDecoratorVisitor
  >();
  private readonly _memberDecoratorVisitors = new MultiMap<
    string,
    MemberDecoratorVisitor
  >();
  private readonly _genericVisitors = new Set<GenericVisitor>();
  private _litFileContext: LitFileContext | undefined;

  constructor(
    program: ts.Program,
    context: ts.TransformationContext,
    visitors: Array<Visitor>
  ) {
    this._program = program;
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

  visitFile = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (!ts.isSourceFile(node)) {
      return node;
    }
    this._litFileContext = new LitFileContext(this._program);
    for (const statement of node.statements) {
      if (ts.isImportDeclaration(statement)) {
        this._analyzeImportDeclaration(statement);
      }
    }
    if (this._litFileContext.imports.size === 0) {
      // No relevant Lit imports, we can ignore this file.
      return node;
    }
    return ts.visitEachChild(node, this.visit, this._context);
  };

  visit = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (this._litFileContext!.removeNodes.delete(node)) {
      return undefined;
    }
    for (const visitor of this._genericVisitors) {
      node = visitor.visit(this._litFileContext!, node);
    }
    if (ts.isImportDeclaration(node)) {
      return this._visitImportDeclaration(node);
    }
    if (ts.isClassDeclaration(node)) {
      return this._visitClassDeclaration(node);
    }
    return ts.visitEachChild(node, this.visit, this._context);
  };

  private _analyzeImportDeclaration(node: ts.ImportDeclaration) {
    // Check if this is one of the many Lit modules.
    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      return;
    }
    const specifier = node.moduleSpecifier.text;
    if (
      !(
        specifier === 'lit' ||
        specifier.startsWith('lit/') ||
        specifier === 'lit-element' ||
        specifier.startsWith('lit-element/') ||
        specifier === '@lit/reactive-element' ||
        specifier.startsWith('@lit/reactive-element/')
      )
    ) {
      return;
    }

    // TODO(aomarks) Maybe handle NamespaceImport (import * as decorators).
    const bindings = node.importClause?.namedBindings;
    if (bindings == undefined || !ts.isNamedImports(bindings)) {
      return;
    }

    for (const importSpecifier of bindings.elements) {
      // Name as exported (Lit's name for it, not whatever the alias is).
      const realName =
        importSpecifier.propertyName?.text ?? importSpecifier.name.text;
      if (realName === 'html') {
        this._litFileContext!.imports.set(importSpecifier, realName);
      } else if (
        // Only handle the decorators we're configured to transform.
        this._classDecoratorVisitors.has(realName) ||
        this._memberDecoratorVisitors.has(realName)
      ) {
        this._litFileContext!.imports.set(importSpecifier, realName);
        // Assume if there's a visitor for a decorator, it's always going to
        // remove any uses of that decorator, and hence we should remove the
        // import too.
        this._litFileContext!.removeNodes.add(importSpecifier);
      }
    }
  }

  private _visitImportDeclaration(node: ts.ImportDeclaration) {
    const pruned = ts.visitEachChild(node, this.visit, this._context);
    return (pruned.importClause?.namedBindings as ts.NamedImports).elements
      .length > 0
      ? pruned
      : // Remove the import altogether if there are no remaining bindings.
        undefined;
  }

  private _identifyImportedLitDecorator(
    decorator: ts.Decorator
  ): string | undefined {
    if (ts.isCallExpression(decorator.expression)) {
      const symbol = this._program
        .getTypeChecker()
        .getSymbolAtLocation(decorator.expression.expression);
      const firstDeclaration = symbol?.declarations[0];
      if (firstDeclaration !== undefined) {
        return this._litFileContext!.imports.get(firstDeclaration);
      }
    }
    return undefined;
  }

  private _visitClassDeclaration(class_: ts.ClassDeclaration) {
    const mutations = new LitClassContext(this._litFileContext!, class_);

    // Class decorators
    for (const decorator of class_.decorators ?? []) {
      const decoratorName = this._identifyImportedLitDecorator(decorator);
      if (decoratorName !== undefined) {
        const visitors = this._classDecoratorVisitors.get(decoratorName) ?? [];
        for (const visitor of visitors) {
          visitor.visit(mutations, decorator);
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
        this._litFileContext!.removeNodes.add(existing.getter);
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
      this._litFileContext!.removeNodes.add(node);
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
      ...(existingProperties
        ? existingProperties.map((prop) =>
            cloneNode(prop, {factory: this._context.factory})
          )
        : []),
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
