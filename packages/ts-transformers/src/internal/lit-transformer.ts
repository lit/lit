/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {LitClassContext} from './lit-class-context.js';
import {LitFileContext} from './lit-file-context.js';
import {isStatic} from './util.js';

import type {
  Visitor,
  ClassDecoratorVisitor,
  MemberDecoratorVisitor,
  GenericVisitor,
} from './visitor.js';

/**
 * A transformer for Lit code.
 *
 * Configured with an array of visitors, each of which handles a specific Lit
 * feature such as a decorator. All visitors are invoked from a single pass
 * through each file.
 *
 * Files are only traversed at all if there is at least one feature imported
 * from an official Lit module (e.g. the "property" decorator), and there is a
 * registered visitor that declares it will handle that feature (e.g. the
 * PropertyVisitor).
 */
export class LitTransformer {
  private readonly _context: ts.TransformationContext;
  private readonly _classDecoratorVisitors = new Map<
    string,
    ClassDecoratorVisitor
  >();
  private readonly _memberDecoratorVisitors = new Map<
    string,
    MemberDecoratorVisitor
  >();
  private readonly _genericVisitors = new Set<GenericVisitor>();
  private readonly _litFileContext: LitFileContext;

  constructor(
    program: ts.Program,
    context: ts.TransformationContext,
    visitors: Array<Visitor>
  ) {
    this._context = context;
    this._litFileContext = new LitFileContext(program);
    for (const visitor of visitors) {
      this._registerVisitor(visitor);
    }
  }

  private _registerVisitor(visitor: Visitor) {
    switch (visitor.kind) {
      case 'classDecorator': {
        if (this._classDecoratorVisitors.has(visitor.decoratorName)) {
          throw new Error(
            'Registered more than one transformer for class decorator' +
              visitor.decoratorName
          );
        }
        this._classDecoratorVisitors.set(visitor.decoratorName, visitor);
        break;
      }
      case 'memberDecorator': {
        if (this._classDecoratorVisitors.has(visitor.decoratorName)) {
          throw new Error(
            'Registered more than one transformer for member decorator ' +
              visitor.decoratorName
          );
        }
        this._memberDecoratorVisitors.set(visitor.decoratorName, visitor);
        break;
      }
      case 'generic': {
        this._genericVisitors.add(visitor);
        break;
      }
      default: {
        throw new Error(
          `Internal error: registering unknown visitor kind ${
            (visitor as void as unknown as Visitor).kind
          }`
        );
      }
    }
  }

  private _unregisterVisitor(visitor: Visitor) {
    switch (visitor.kind) {
      case 'classDecorator': {
        this._classDecoratorVisitors.delete(visitor.decoratorName);
        break;
      }
      case 'memberDecorator': {
        this._memberDecoratorVisitors.delete(visitor.decoratorName);
        break;
      }
      case 'generic': {
        this._genericVisitors.delete(visitor);
        break;
      }
      default: {
        throw new Error(
          `Internal error: unregistering unknown visitor kind ${
            (visitor as void as unknown as Visitor).kind
          }`
        );
      }
    }
  }

  visitFile = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (!ts.isSourceFile(node)) {
      return node;
    }
    let traversalNeeded = false;
    for (const statement of node.statements) {
      if (ts.isImportDeclaration(statement)) {
        if (this._updateFileContextWithLitImports(statement)) {
          // Careful with short-circuiting here! We must run
          // `_updateFileContextWithLitImports` on every import statement, even
          // if we already know we need a traversal.
          traversalNeeded = true;
        }
      }
    }
    if (!traversalNeeded) {
      // No relevant transforms could apply, we can ignore this file.
      return node;
    }
    node = ts.visitEachChild(node, this.visit, this._context);
    this._litFileContext.clear();
    return node;
  };

  visit = (node: ts.Node): ts.VisitResult<ts.Node | undefined> => {
    if (this._litFileContext.nodeReplacements.has(node)) {
      // A node that some previous visitor has requested to be replaced.
      return this._litFileContext.nodeReplacements.get(node);
    }
    for (const visitor of this._genericVisitors) {
      node = visitor.visit(this._litFileContext, node);
    }
    if (ts.isImportDeclaration(node)) {
      return this._visitImportDeclaration(node);
    }
    if (ts.isClassDeclaration(node)) {
      return this._visitClassDeclaration(node);
    }
    return ts.visitEachChild(node, this.visit, this._context);
  };

  /**
   * Add an entry to our "litImports" map for each relevant imported symbol, if
   * this is an import from an official Lit package. Returns whether or not
   * anything relevant was found.
   */
  private _updateFileContextWithLitImports(
    node: ts.ImportDeclaration
  ): boolean {
    // TODO(aomarks) Support re-exports (e.g. if a user re-exports a Lit
    // decorator from one of their own modules).

    if (!ts.isStringLiteral(node.moduleSpecifier)) {
      return false;
    }
    const specifier = node.moduleSpecifier.text;
    // We're only interested in imports from one of the official lit packages.
    if (!isLitImport(specifier)) {
      return false;
    }

    if (!hasJsExtensionOrIsDefaultModule(specifier)) {
      // Note there is no way to properly surface a TypeScript diagnostic during
      // transform: https://github.com/Microsoft/TypeScript/issues/19615.
      throw new Error(
        stringifyDiagnostics([
          createDiagnostic(
            node.getSourceFile(),
            node.moduleSpecifier,
            `Invalid Lit import style. Did you mean '${specifier}.js'?`
          ),
        ])
      );
    }

    // TODO(aomarks) Maybe handle NamespaceImport (import * as decorators).
    const bindings = node.importClause?.namedBindings;
    if (bindings == undefined || !ts.isNamedImports(bindings)) {
      return false;
    }

    let traversalNeeded = false;
    for (const importSpecifier of bindings.elements) {
      // Name as exported (Lit's name for it, not whatever the alias is).
      const realName =
        importSpecifier.propertyName?.text ?? importSpecifier.name.text;
      if (realName === 'html') {
        this._litFileContext.litImports.set(importSpecifier, realName);
        // TODO(aomarks) We don't set traversalNeeded for the html tag import,
        // because we don't currently have any transforms that aren't already
        // associated with a decorator. If that changed, visitors should
        // probably have a static field to declare which imports they care
        // about.
      } else {
        // Only handle the decorators we're configured to transform.
        const visitor =
          this._classDecoratorVisitors.get(realName) ??
          this._memberDecoratorVisitors.get(realName);
        if (visitor !== undefined) {
          this._litFileContext.litImports.set(importSpecifier, realName);
          // Either remove the binding or replace it with another identifier.
          const replacement = visitor.importBindingReplacement
            ? this._context.factory.createIdentifier(
                visitor.importBindingReplacement
              )
            : undefined;
          this._litFileContext.nodeReplacements.set(
            importSpecifier,
            replacement
          );
          traversalNeeded = true;
        }
      }
    }
    return traversalNeeded;
  }

  private _visitImportDeclaration(node: ts.ImportDeclaration) {
    const numBindingsBefore =
      (node.importClause?.namedBindings as ts.NamedImports | undefined)
        ?.elements?.length ?? 0;
    node = ts.visitEachChild(node, this.visit, this._context);
    const numBindingsAfter =
      (node.importClause?.namedBindings as ts.NamedImports | undefined)
        ?.elements?.length ?? 0;
    if (
      numBindingsAfter === 0 &&
      numBindingsBefore !== numBindingsAfter &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      isLitImport(node.moduleSpecifier.text)
    ) {
      // Remove the import altogether if there are no bindings left. But only if
      // we actually modified the import, and it's from an official Lit module.
      // Otherwise we might remove imports that are still needed for their
      // side-effects.
      return undefined;
    }
    return node;
  }

  private *getDecorators(node: ts.Node): IterableIterator<ts.Decorator> {
    if (!ts.canHaveDecorators(node)) {
      return;
    }
    for (const modifier of node.modifiers ?? []) {
      if (ts.isDecorator(modifier)) {
        yield modifier;
      }
    }
  }

  private _visitClassDeclaration(class_: ts.ClassDeclaration) {
    const litClassContext = new LitClassContext(this._litFileContext, class_);

    // Class decorators
    for (const decorator of this.getDecorators(class_)) {
      if (!ts.isCallExpression(decorator.expression)) {
        continue;
      }
      const decoratorName = this._litFileContext.getCanonicalName(
        decorator.expression.expression
      );
      if (decoratorName === undefined) {
        continue;
      }
      this._classDecoratorVisitors
        .get(decoratorName)
        ?.visit(litClassContext, decorator);
    }

    // Class member decorators
    for (const member of class_.members ?? []) {
      for (const decorator of this.getDecorators(member)) {
        if (!ts.isCallExpression(decorator.expression)) {
          continue;
        }
        const decoratorName = this._litFileContext.getCanonicalName(
          decorator.expression.expression
        );
        if (decoratorName === undefined) {
          continue;
        }
        this._memberDecoratorVisitors
          .get(decoratorName)
          ?.visit(litClassContext, member, decorator);
      }
    }

    if (litClassContext.reactiveProperties.length > 0) {
      const oldProperties =
        this._findExistingStaticPropertiesExpression(class_);
      const newProperties = this._createStaticPropertiesExpression(
        oldProperties,
        litClassContext.reactiveProperties
      );
      if (oldProperties !== undefined) {
        this._litFileContext.nodeReplacements.set(oldProperties, newProperties);
      } else {
        const factory = this._context.factory;
        const staticPropertiesField = factory.createPropertyDeclaration(
          [factory.createModifier(ts.SyntaxKind.StaticKeyword)],
          factory.createIdentifier('properties'),
          undefined,
          undefined,
          newProperties
        );
        litClassContext.classMembers.unshift(staticPropertiesField);
      }
    }

    this._addExtraConstructorStatements(litClassContext);

    for (const visitor of litClassContext.additionalClassVisitors) {
      this._registerVisitor(visitor);
    }

    // Note we do need to `ts.visitEachChild` here, because [1] there might be
    // nodes that still need to be deleted via `this._nodesToRemove` (e.g. a
    // property decorator or a property itself), and [2] in theory there could
    // be a nested custom element definition somewhere in this class.
    const transformedClass = ts.visitEachChild(
      this._context.factory.updateClassDeclaration(
        class_,
        class_.modifiers,
        class_.name,
        class_.typeParameters,
        class_.heritageClauses,
        [...litClassContext.classMembers, ...class_.members]
      ),
      this.visit,
      this._context
    );

    // These visitors only apply within the scope of the current class.
    for (const visitor of litClassContext.additionalClassVisitors) {
      this._unregisterVisitor(visitor);
    }

    return [transformedClass, ...litClassContext.adjacentStatements];
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
  private _createStaticPropertiesExpression(
    existingProperties: ts.ObjectLiteralExpression | undefined,
    newProperties: Array<{
      name: string;
      options?: ts.ObjectLiteralExpression;
    }>
  ) {
    const factory = this._context.factory;
    const properties = [
      ...(existingProperties?.properties ?? []),
      ...newProperties.map(({name, options}) =>
        factory.createPropertyAssignment(
          factory.createIdentifier(name),
          options ? options : factory.createObjectLiteralExpression([], false)
        )
      ),
    ];
    return factory.createObjectLiteralExpression(properties, true);
  }

  private _findExistingStaticPropertiesExpression(
    class_: ts.ClassDeclaration
  ): ts.ObjectLiteralExpression | undefined {
    const staticProperties = class_.members.find(
      (member) =>
        isStatic(member) &&
        member.name !== undefined &&
        ts.isIdentifier(member.name) &&
        member.name.text === 'properties'
    );
    if (staticProperties === undefined) {
      return undefined;
    }
    // Static class field.
    if (ts.isPropertyDeclaration(staticProperties)) {
      if (
        staticProperties.initializer !== undefined &&
        ts.isObjectLiteralExpression(staticProperties.initializer)
      ) {
        return staticProperties.initializer;
      } else {
        throw new Error(
          'Static properties class field initializer must be an object expression.'
        );
      }
    }
    // Static getter.
    if (ts.isGetAccessorDeclaration(staticProperties)) {
      const returnStatement = staticProperties.body?.statements[0];
      if (
        returnStatement === undefined ||
        !ts.isReturnStatement(returnStatement)
      ) {
        throw new Error(
          'Static properties getter must contain purely a return statement.'
        );
      }
      const returnExpression = returnStatement.expression;
      if (
        returnExpression === undefined ||
        !ts.isObjectLiteralExpression(returnExpression)
      ) {
        throw new Error(
          'Static properties getter must return an object expression.'
        );
      }
      return returnExpression;
    }
    throw new Error(
      'Static properties class member must be a class field or getter.'
    );
  }

  /**
   * Create or modify a class constructor to add additional constructor
   * statements from any of our transforms.
   */
  private _addExtraConstructorStatements(context: LitClassContext) {
    if (context.extraConstructorStatements.length === 0) {
      return;
    }
    const existingCtor = context.class.members.find(
      ts.isConstructorDeclaration
    );
    const factory = this._context.factory;
    if (existingCtor === undefined) {
      const newCtor = factory.createConstructorDeclaration(
        undefined,
        [],
        factory.createBlock(
          [
            factory.createExpressionStatement(
              factory.createCallExpression(factory.createSuper(), undefined, [
                factory.createSpreadElement(
                  factory.createIdentifier('arguments')
                ),
              ])
            ),
            ...context.extraConstructorStatements,
          ],
          true
        )
      );
      context.classMembers.push(newCtor);
    } else {
      if (existingCtor.body === undefined) {
        throw new Error('Unexpected error: constructor has no body');
      }
      const newCtorBody = factory.createBlock([
        ...existingCtor.body.statements,
        ...context.extraConstructorStatements,
      ]);
      context.litFileContext.nodeReplacements.set(
        existingCtor.body,
        newCtorBody
      );
    }
  }
}

const isLitImport = (specifier: string) =>
  specifier === 'lit' ||
  specifier.startsWith('lit/') ||
  specifier === 'lit-element' ||
  specifier.startsWith('lit-element/') ||
  specifier.startsWith('@lit/');

/**
 * Returns true for:
 *   lit
 *   lit/decorators.js
 *   @lit/reactive-element
 *   @lit/reactive-element/decorators.js
 *
 * Returns false for:
 *   lit/decorators
 *   @lit/reactive-element/decorators
 */
const hasJsExtensionOrIsDefaultModule = (specifier: string) =>
  specifier.endsWith('.js') || /^(@[^/]+\/)?[^/]+$/.test(specifier);

const createDiagnostic = (
  file: ts.SourceFile,
  node: ts.Node,
  message: string,
  relatedInformation?: ts.DiagnosticRelatedInformation[]
): ts.DiagnosticWithLocation => {
  return {
    file,
    start: node.getStart(file),
    length: node.getWidth(file),
    category: ts.DiagnosticCategory.Error,
    code: 2325, // Meaningless but unique number.
    messageText: message,
    relatedInformation,
  };
};

const stringifyDiagnostics = (diagnostics: ts.Diagnostic[]) => {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName(name: string) {
      return name;
    },
    getCurrentDirectory() {
      return process.cwd();
    },
    getNewLine() {
      return '\n';
    },
  });
};
