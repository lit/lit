/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type * as ts from 'typescript';
import type {LitClassContext} from './lit-class-context.js';
import type {LitFileContext} from './lit-file-context.js';

export type Visitor =
  | ClassDecoratorVisitor
  | MemberDecoratorVisitor
  | GenericVisitor;

export interface ClassDecoratorVisitor {
  kind: 'classDecorator';
  decoratorName: string;

  visit(classContext: LitClassContext, decorator: ts.Decorator): void;
}

export interface MemberDecoratorVisitor {
  kind: 'memberDecorator';
  decoratorName: string;

  visit(
    classContext: LitClassContext,
    member: ts.ClassElement,
    decorator: ts.Decorator
  ): void;
}

export interface GenericVisitor {
  kind: 'generic';

  visit(fileContext: LitFileContext, node: ts.Node): ts.Node;
}
