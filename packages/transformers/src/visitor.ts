/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type * as ts from 'typescript';
import type {LitElementMutations} from './mutations.js';

export type Visitor = ClassDecoratorVisitor | MemberDecoratorVisitor;

export interface ClassDecoratorVisitor {
  kind: 'classDecorator';
  decoratorName: string;

  visit(
    mutations: LitElementMutations,
    class_: ts.ClassDeclaration,
    decorator: ts.Decorator
  ): void;
}

export interface MemberDecoratorVisitor {
  kind: 'memberDecorator';
  decoratorName: string;

  visit(
    mutations: LitElementMutations,
    member: ts.ClassElement,
    decorator: ts.Decorator
  ): void;
}
