/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @fileoverview
 *
 * Utilities for analyzing class declarations
 */

import type ts from 'typescript';
import {DiagnosticCode} from '../diagnostic-code.js';
import {createDiagnostic} from '../errors.js';
import {
  ClassDeclaration,
  AnalyzerInterface,
  DeclarationInfo,
  ClassHeritage,
  Reference,
  ClassField,
  ClassMethod,
  MixinDeclaration,
} from '../model.js';
import {
  isLitElementSubclass,
  getLitElementDeclaration,
} from '../lit-element/lit-element.js';
import {getReferenceForIdentifier} from '../references.js';
import {parseNodeJSDocInfo} from './jsdoc.js';
import {
  hasDefaultModifier,
  hasStaticModifier,
  hasExportModifier,
  getPrivacy,
} from '../utils.js';
import {getFunctionLikeInfo} from './functions.js';
import {getTypeForNode} from '../types.js';
import {
  isCustomElementSubclass,
  getCustomElementDeclaration,
} from '../custom-elements/custom-elements.js';

export type TypeScript = typeof ts;

/**
 * Returns an analyzer `ClassDeclaration` model for the given
 * ts.ClassLikeDeclaration.
 *
 * Note, the `docNode` may differ from the `declaration` in the case of a const
 * assignment to a class expression, as the JSDoc will be attached to the
 * VariableStatement rather than the class-like expression.
 */
export const getClassDeclaration = (
  declaration: ts.ClassLikeDeclaration,
  name: string,
  analyzer: AnalyzerInterface,
  docNode?: ts.Node,
  isMixinClass?: boolean
) => {
  if (isLitElementSubclass(declaration, analyzer)) {
    return getLitElementDeclaration(declaration, analyzer, isMixinClass);
  }
  if (isCustomElementSubclass(declaration, analyzer)) {
    return getCustomElementDeclaration(declaration, analyzer, isMixinClass);
  }
  return new ClassDeclaration({
    name,
    node: declaration,
    getHeritage: () => getHeritage(declaration, analyzer, isMixinClass),
    ...parseNodeJSDocInfo(docNode ?? declaration, analyzer),
    ...getClassMembers(declaration, analyzer),
  });
};

const getIsReadonlyForNode = (
  node: ts.Node,
  analyzer: AnalyzerInterface
): boolean => {
  const {typescript} = analyzer;
  if (typescript.isPropertyDeclaration(node)) {
    return (
      node.modifiers?.some((mod) =>
        typescript.isReadonlyKeywordOrPlusOrMinusToken(mod)
      ) ||
      typescript
        .getJSDocTags(node)
        .some((tag) => tag.tagName.text === 'readonly')
    );
  } else if (typescript.isStatement(node)) {
    return typescript
      .getJSDocTags(node)
      .some((tag) => tag.tagName.text === 'readonly');
  }
  return false;
};

/**
 * Returns the `fields` and `methods` of a class.
 */
export const getClassMembers = (
  declaration: ts.ClassLikeDeclaration,
  analyzer: AnalyzerInterface
) => {
  const {typescript} = analyzer;
  const fieldMap = new Map<string, ClassField>();
  const staticFieldMap = new Map<string, ClassField>();
  const methodMap = new Map<string, ClassMethod>();
  const staticMethodMap = new Map<string, ClassMethod>();
  const accessors = new Map<
    string,
    {get?: ts.AccessorDeclaration; set?: ts.AccessorDeclaration}
  >();
  declaration.members.forEach((member) => {
    // Ignore non-implementation signatures of overloaded methods by checking
    // for `node.body`.
    if (typescript.isConstructorDeclaration(member) && member.body) {
      // TODO(bennypowers): We probably want to see if this matches what TypeScript considers a field initialization.
      // Maybe instead of iterating through the constructor statements, we walk the body looking for any
      // assignment expression so that we get ones inside of if statements, in parenthesized expressions, etc.
      //
      // Also, this doesn't cover destructuring assignment.
      //
      // This is ok for now because these are rare ways to "declare" a field,
      // especially in web components where you shouldn't have constructor parameters.
      member.body.statements.forEach((statement) => {
        if (
          typescript.isExpressionStatement(statement) &&
          isConstructorFieldInitializer(statement.expression, typescript)
        ) {
          const name = statement.expression.left.name.getText();
          fieldMap.set(
            name,
            new ClassField({
              name,
              type: getTypeForNode(statement.expression.right, analyzer),
              privacy: getPrivacy(typescript, statement),
              readonly: getIsReadonlyForNode(statement, analyzer),
              node: statement.expression,
            })
          );
        }
      });
    } else if (typescript.isMethodDeclaration(member) && member.body) {
      const info = getMemberInfo(typescript, member);
      const name = member.name.getText();
      (info.static ? staticMethodMap : methodMap).set(
        name,
        new ClassMethod({
          ...info,
          ...getFunctionLikeInfo(member, name, analyzer),
          ...parseNodeJSDocInfo(member, analyzer),
          node: member,
        })
      );
    } else if (typescript.isPropertyDeclaration(member)) {
      if (
        !typescript.isIdentifier(member.name) &&
        !typescript.isPrivateIdentifier(member.name)
      ) {
        analyzer.addDiagnostic(
          createDiagnostic({
            typescript,
            node: member,
            message:
              '@lit-labs/analyzer only supports analyzing class properties ' +
              'named with plain identifiers, or private class fields. This ' +
              'property was ignored: ' +
              member.name.getText(),
            category: typescript.DiagnosticCategory.Warning,
            code: DiagnosticCode.UNSUPPORTED,
          })
        );
        return;
      }

      const info = getMemberInfo(typescript, member);

      (info.static ? staticFieldMap : fieldMap).set(
        member.name.getText(),
        new ClassField({
          ...info,
          default: member.initializer?.getText(),
          type: getTypeForNode(member, analyzer),
          ...parseNodeJSDocInfo(member, analyzer),
          readonly: getIsReadonlyForNode(member, analyzer),
          node: member,
        })
      );
    } else if (typescript.isAccessor(member)) {
      const name = member.name.getText();
      const _accessors = accessors.get(name) ?? {};
      if (typescript.isGetAccessor(member)) _accessors.get = member;
      else if (typescript.isSetAccessor(member)) _accessors.set = member;
      accessors.set(name, _accessors);
    }
  });
  for (const [name, {get, set}] of accessors) {
    if (get ?? set) {
      fieldMap.set(
        name,
        new ClassField({
          name,
          type: getTypeForNode((get ?? set)!, analyzer),
          privacy: getPrivacy(typescript, (get ?? set)!),
          readonly: !!get && !set,
          // TODO(bennypowers): derive from getter?
          // default: ???
          // TODO(bennypowers): reflect, etc?
          node: (set ?? get)!,
        })
      );
    }
  }
  return {
    fieldMap,
    staticFieldMap,
    methodMap,
    staticMethodMap,
  };
};

const getMemberInfo = (
  typescript: TypeScript,
  node: ts.MethodDeclaration | ts.PropertyDeclaration
) => {
  return {
    name: node.name.getText(),
    static: hasStaticModifier(typescript, node),
    privacy: getPrivacy(typescript, node),
  };
};

/**
 * Returns the name of a class declaration.
 */
const getClassDeclarationName = (
  declaration: ts.ClassDeclaration,
  analyzer: AnalyzerInterface
) => {
  const name =
    declaration.name?.text ??
    // The only time a class declaration will not have a name is when it is
    // a default export, aka `export default class { }`
    (hasDefaultModifier(analyzer.typescript, declaration)
      ? 'default'
      : undefined);
  if (name === undefined) {
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: declaration,
        message: `Illegal syntax: a class declaration must either have a name or be a default export`,
      })
    );
  }
  return name;
};

/**
 * Returns name and model factory for a class declaration.
 */
export const getClassDeclarationInfo = (
  declaration: ts.ClassDeclaration,
  analyzer: AnalyzerInterface
): DeclarationInfo | undefined => {
  const name = getClassDeclarationName(declaration, analyzer);
  if (name === undefined) {
    return undefined;
  }
  return {
    name,
    node: declaration,
    factory: () => getClassDeclaration(declaration, name, analyzer),
    isExport: hasExportModifier(analyzer.typescript, declaration),
  };
};

/**
 * Returns the superClass and any applied mixins for a given class declaration.
 */
export const getHeritage = (
  declaration: ts.ClassLikeDeclarationBase,
  analyzer: AnalyzerInterface,
  isMixinClass?: boolean
): ClassHeritage => {
  const extendsClause = declaration.heritageClauses?.find(
    (c) => c.token === analyzer.typescript.SyntaxKind.ExtendsKeyword
  );
  if (extendsClause !== undefined) {
    if (extendsClause.types.length === 1) {
      return getHeritageFromExpression(
        extendsClause.types[0].expression,
        analyzer,
        isMixinClass
      );
    }
    analyzer.addDiagnostic(
      createDiagnostic({
        typescript: analyzer.typescript,
        node: extendsClause,
        message:
          'Illegal syntax: did not expect extends clause to have multiple types',
      })
    );
  }
  // No extends clause; return empty heritage
  return {
    mixins: [],
    superClass: undefined,
  };
};

export const getHeritageFromExpression = (
  expression: ts.Expression,
  analyzer: AnalyzerInterface,
  isMixinClass?: boolean
): ClassHeritage => {
  const mixins: Reference[] = [];
  const superClass = getSuperClassAndMixins(expression, mixins, analyzer);
  return {
    superClass: isMixinClass ? undefined : superClass,
    mixins,
  };
};

export const getSuperClassAndMixins = (
  expression: ts.Expression,
  foundMixins: Reference[],
  analyzer: AnalyzerInterface
): Reference | undefined => {
  // TODO(kschaaf) Could add support for inline class expressions here as well
  if (analyzer.typescript.isIdentifier(expression)) {
    return getReferenceForIdentifier(expression, analyzer);
  } else if (
    analyzer.typescript.isCallExpression(expression) &&
    analyzer.typescript.isIdentifier(expression.expression)
  ) {
    // FYI we purposely restrict to identifiers since we represent mixins
    // as references. If we want to support complex expressions in future,
    // we will need to rework that in the model.
    const mixinRef = getReferenceForIdentifier(expression.expression, analyzer);
    // We need to eagerly dereference a mixin ref to know what argument the
    // super class is passed into
    let mixin;

    try {
      mixin = mixinRef?.dereference(MixinDeclaration);
    } catch (_err) {
      // It wasn't a MixinDeclaration for whatever reason
      mixin = undefined;
    }

    // TODO (43081j): consider supporting external mixins properly at some point
    // An external mixin is one which we discovered via analysis (e.g. CEM)
    // but don't have a reference to in sources. In future, we should support
    // those as it is likely we will pull most dependencies from manifest
    // analysis rather than source.
    // See issue #4492
    if (mixinRef === undefined || mixin === undefined) {
      analyzer.addDiagnostic(
        createDiagnostic({
          typescript: analyzer.typescript,
          node: expression,
          message:
            `This is presumed to be a mixin but it could not be found ` +
            `in the current project. Mixins imported from outside the ` +
            `project are not yet supported ` +
            `(see https://github.com/lit/lit/issues/4492).`,
          code: DiagnosticCode.UNSUPPORTED,
          category: analyzer.typescript.DiagnosticCategory.Warning,
        })
      );
      return undefined;
    }
    foundMixins.push(mixinRef);
    const superArg = expression.arguments[mixin.superClassArgIndex];
    const superClass = getSuperClassAndMixins(superArg, foundMixins, analyzer);
    return superClass;
  }
  analyzer.addDiagnostic(
    createDiagnostic({
      typescript: analyzer.typescript,
      node: expression,
      message: `Expected expression to be a concrete superclass or mixin.`,
      code: DiagnosticCode.UNSUPPORTED,
      category: analyzer.typescript.DiagnosticCategory.Warning,
    })
  );
  return undefined;
};

export const isConstructorFieldInitializer = (
  expression: ts.Expression,
  typescript: typeof ts
): expression is ConstructorFieldInitializer => {
  return (
    typescript.isBinaryExpression(expression) &&
    expression.operatorToken.kind === typescript.SyntaxKind.EqualsToken &&
    typescript.isPropertyAccessExpression(expression.left) &&
    expression.left.expression.kind === typescript.SyntaxKind.ThisKeyword
  );
};

type ConstructorFieldInitializer = ts.AssignmentExpression<ts.EqualsToken> & {
  left: ts.PropertyAccessExpression & {expression: ts.ThisExpression};
};

export const maybeGetAppliedMixin = (
  expression: ts.Expression,
  identifier: ts.Identifier,
  analyzer: AnalyzerInterface
): ClassDeclaration | undefined => {
  if (
    analyzer.typescript.isCallExpression(expression) &&
    analyzer.typescript.isIdentifier(expression.expression)
  ) {
    const mixinRef = getReferenceForIdentifier(expression.expression, analyzer);

    try {
      mixinRef?.dereference(MixinDeclaration);
    } catch (_err) {
      return undefined;
    }

    const heritage = getHeritageFromExpression(expression, analyzer);

    if (heritage.superClass) {
      return new ClassDeclaration({
        name: identifier.text,
        node: expression,
        getHeritage: () => heritage,
      });
    }
  }
  return undefined;
};
