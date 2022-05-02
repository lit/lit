/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import ts from 'typescript';
import {PackagePath} from './paths.js';

export class Package {
  readonly modules: ReadonlyArray<Module>;

  constructor(modules: ReadonlyArray<Module>) {
    this.modules = modules;
  }
}

export interface ModuleInit {
  sourceFile: ts.SourceFile;
  path: PackagePath;
}

export class Module {
  readonly sourceFile: ts.SourceFile;
  readonly path: PackagePath;
  readonly declarations: Array<Declaration> = [];

  constructor(init: ModuleInit) {
    this.sourceFile = init.sourceFile;
    this.path = init.path;
  }
}

export type Declaration = ClassDeclaration;

export interface ClassDeclarationInit {
  name: string | undefined;
  node: ts.ClassDeclaration;
}

export class ClassDeclaration {
  readonly name: string | undefined;
  readonly node: ts.ClassDeclaration;

  constructor(init: ClassDeclarationInit) {
    this.name = init.name;
    this.node = init.node;
  }
}

interface LitElementDeclarationInit extends ClassDeclarationInit {
  tagname: string | undefined;
  reactiveProperties: Map<string, ReactiveProperty>;
  readonly events: Map<string, Event>;
}

export class LitElementDeclaration extends ClassDeclaration {
  readonly isLitElement = true;

  /**
   * The element's tag name, if one is associated with this class declaration,
   * such as with a `@customElement()` decorator or `customElements.define()`
   * call in the same module.
   *
   * This is undefined if the element has no associated custom element
   * registration in the same module. This class might be intended for use as a
   * base class or with scoped custom element registries.
   */
  readonly tagname: string | undefined;

  readonly reactiveProperties: Map<string, ReactiveProperty>;

  readonly events: Map<string, Event>;

  constructor(init: LitElementDeclarationInit) {
    super(init);
    this.tagname = init.tagname;
    this.reactiveProperties = init.reactiveProperties;
    this.events = init.events;
  }
}

export interface ReactiveProperty {
  name: string;
  node: ts.PropertyDeclaration;

  // TODO(justinfagnani): where do we convert this to a type string and CEM type references?
  type: ts.Type;
  typeString: string;

  reflect: boolean;

  // TODO(justinfagnani): should we convert into attribute name?
  attribute: boolean | string | undefined;

  /**
   * The test of the `type` property option.
   *
   * This is really only useful if the type is one of the well known types:
   * String, Number, or Boolean.
   */
  typeOption: string | undefined;

  /**
   * The Node for the `converter` option if present.
   *
   * This is mostly useful to know whether the `type` option can be interpreted
   * with the default semantics or not.
   */
  converter: ts.Node | undefined;

  // TODO(justinfagnani): hasChanged?
}

export interface Event {
  name: string;
  description: string | undefined;
  typeString: string | undefined;
  // TODO(justinfagnani): store a type reference too
}
