/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as ts from 'typescript';
import {isStatic, extendsReactiveElement} from '../util.js';

import type {LitFileContext} from '../lit-file-context.js';
import type {GenericVisitor} from '../visitor.js';

/**
 * Transform:
 *
 *   static styles = css`p { color: red; }`
 *
 * Into:
 *
 *   static get styles() {
 *     return css`p { color: red; }`;
 *   }
 *
 * This transform is useful because Lit is not compatible with standard class
 * fields, so standard class field emit needs to be disabled
 * (useDefineForClassFields: false). However, this means statics turn into
 * `MyClass.foo = ...` assignments following the class declaration, which has
 * poor readability compared to a getter.
 */
export class StaticStylesVisitor implements GenericVisitor {
  readonly kind = 'generic';

  private readonly _factory: ts.NodeFactory;
  private readonly _program: ts.Program;

  constructor({factory}: ts.TransformationContext, program: ts.Program) {
    this._factory = factory;
    this._program = program;
  }

  visit(_litFileContext: LitFileContext, node: ts.Node): ts.Node {
    if (
      !(
        ts.isPropertyDeclaration(node) &&
        isStatic(node) &&
        node.name?.getText() === 'styles' &&
        node.initializer !== undefined &&
        ts.isClassDeclaration(node.parent) &&
        extendsReactiveElement(node.parent, this._program.getTypeChecker())
      )
    ) {
      return node;
    }
    return this._createStylesGetter(node.initializer);
  }

  private _createStylesGetter(
    initializer: ts.Expression
  ): ts.GetAccessorDeclaration {
    const f = this._factory;
    return f.createGetAccessorDeclaration(
      undefined,
      [f.createModifier(ts.SyntaxKind.StaticKeyword)],
      f.createIdentifier('styles'),
      [],
      undefined,
      f.createBlock([f.createReturnStatement(initializer)], true)
    );
  }
}
