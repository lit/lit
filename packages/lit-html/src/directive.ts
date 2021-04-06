/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Disconnectable, Part} from './lit-html';

export {
  AttributePart,
  BooleanAttributePart,
  ChildPart,
  ElementPart,
  EventPart,
  Part,
} from './lit-html';

export interface DirectiveClass {
  new (part: PartInfo): Directive;
}

/**
 * This utility type extracts the signature of a directive class's render()
 * method so we can use it for the type of the generated directive function.
 */
export type DirectiveParameters<C extends Directive> = Parameters<C['render']>;

/**
 * A generated directive function doesn't evaluate the directive, but just
 * returns a DirectiveResult object that captures the arguments.
 */
export interface DirectiveResult<C extends DirectiveClass = DirectiveClass> {
  /** @internal */
  _$litDirective$: C;
  /** @internal */
  values: DirectiveParameters<InstanceType<C>>;
}

export const PartType = {
  ATTRIBUTE: 1,
  CHILD: 2,
  PROPERTY: 3,
  BOOLEAN_ATTRIBUTE: 4,
  EVENT: 5,
  ELEMENT: 6,
} as const;

export type PartType = typeof PartType[keyof typeof PartType];

export interface ChildPartInfo {
  readonly type: typeof PartType.CHILD;
}

export interface AttributePartInfo {
  readonly type:
    | typeof PartType.ATTRIBUTE
    | typeof PartType.PROPERTY
    | typeof PartType.BOOLEAN_ATTRIBUTE
    | typeof PartType.EVENT;
  readonly strings?: ReadonlyArray<string>;
  readonly name: string;
  readonly tagName: string;
}

export interface ElementPartInfo {
  readonly type: typeof PartType.ELEMENT;
}

/**
 * Information about the part a directive is bound to.
 *
 * This is useful for checking that a directive is attached to a valid part,
 * such as with directive that can only be used on attribute bindings.
 */
export type PartInfo = ChildPartInfo | AttributePartInfo | ElementPartInfo;

/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 */
export const directive = <C extends DirectiveClass>(c: C) => (
  ...values: DirectiveParameters<InstanceType<C>>
): DirectiveResult<C> => ({
  _$litDirective$: c,
  values,
});

/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
export abstract class Directive {
  //@internal
  __part!: Part;
  //@internal
  __attributeIndex: number | undefined;
  //@internal
  __directive?: Directive;

  //@internal
  _$parent!: Disconnectable;

  // These will only exist on the AsyncDirective subclass
  //@internal
  _$disconnetableChildren?: Set<Disconnectable>;
  //@internal
  _$setDirectiveConnected?(isConnected: boolean): void;

  constructor(_partInfo: PartInfo) {}

  /** @internal */
  _$initialize(
    part: Part,
    parent: Disconnectable,
    attributeIndex: number | undefined
  ) {
    this.__part = part;
    this._$parent = parent;
    this.__attributeIndex = attributeIndex;
  }
  /** @internal */
  _$resolve(part: Part, props: Array<unknown>): unknown {
    return this.update(part, props);
  }

  abstract render(...props: Array<unknown>): unknown;

  update(_part: Part, props: Array<unknown>): unknown {
    return this.render(...props);
  }
}
