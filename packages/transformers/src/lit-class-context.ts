/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type * as ts from 'typescript';
import type {LitFileContext} from './lit-file-context.js';
import type {Visitor} from './visitor.js';

/**
 * Changes that need making to a LitElement class.
 */
export class LitClassContext {
  readonly litFileContext: LitFileContext;

  readonly class_: ts.ClassLikeDeclaration;

  /**
   * Remove a node from the AST (e.g. a decorator that is no longer required).
   * Note the node must be a descendant of this specific element class.
   */
  readonly removeNodes = new Set<ts.Node>();

  /**
   * Add a new class member to this element (e.g. a new getter).
   */
  readonly classMembers: ts.ClassElement[] = [];

  /**
   * Add a new property to the `static get properties` block of this element.
   */
  readonly reactiveProperties: Array<{
    name: string;
    options?: ts.ObjectLiteralExpression;
  }> = [];

  /**
   * Add a new statement that will be inserted into the AST immediately after
   * this element (e.g. a customElements.define() call).
   */
  readonly adjacentStatements: ts.Node[] = [];

  /**
   * Additional visitors that will run only in the scope of the current class.
   */
  readonly visitors = new Set<Visitor>();

  constructor(litFileContext: LitFileContext, class_: ts.ClassLikeDeclaration) {
    this.litFileContext = litFileContext;
    this.class_ = class_;
  }
}
