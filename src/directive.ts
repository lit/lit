/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {directive as legacyDirective} from './lib/directive.js';
import * as legacyLit from './lit-html.js';

export const PartType = {
  ATTRIBUTE: 1,
  CHILD: 2,
  PROPERTY: 3,
  BOOLEAN_ATTRIBUTE: 4,
  EVENT: 5,
  ELEMENT: 6,
} as const ;

export type PartType = typeof PartType[keyof typeof PartType];

export interface ChildPartInfo {
  readonly type: typeof PartType.CHILD;
}

export interface AttributePartInfo {
  // eslint-disable-next-line @typescript-eslint/type-annotation-spacing
  readonly type:|typeof PartType.ATTRIBUTE|
      typeof PartType.PROPERTY|typeof PartType.BOOLEAN_ATTRIBUTE|
      typeof PartType.EVENT;
  readonly strings?: ReadonlyArray<string>;
  readonly name: string;
  readonly tagName: string;
}

export type Part = ChildPart|AttributePart|BooleanAttributePart|EventPart;

export type{ChildPart};
class ChildPart {
  readonly type = PartType.CHILD;
  readonly options: legacyLit.RenderOptions|undefined;
  readonly legacyPart: legacyLit.NodePart;
  constructor(legacyPart: legacyLit.NodePart) {
    this.options = legacyPart.options;
    this.legacyPart = legacyPart;
  }

  get parentNode(): Node {
    return this.legacyPart.startNode.parentNode!;
  }

  get startNode(): Node|null {
    return this.legacyPart.startNode;
  }

  get endNode(): Node|null {
    return this.legacyPart.endNode;
  }
}

export type{AttributePart};
class AttributePart {
  readonly type: typeof PartType.ATTRIBUTE|typeof PartType.PROPERTY;
  readonly legacyPart: legacyLit.AttributePart|legacyLit.PropertyPart;

  get options(): legacyLit.RenderOptions|undefined {
    return undefined;
  }

  get name(): string {
    return this.legacyPart.committer.name;
  }

  get element(): Element {
    return this.legacyPart.committer.element;
  }

  /**
   * If this attribute part represents an interpolation, this contains the
   * static strings of the interpolation. For single-value, complete bindings,
   * this is undefined.
   */
  get strings() {
    return this.legacyPart.committer.strings;
  }
  get tagName() {
    return this.element.tagName;
  }

  constructor(legacyPart: legacyLit.AttributePart|legacyLit.PropertyPart) {
    this.legacyPart = legacyPart;
    this.type = (legacyPart instanceof legacyLit.PropertyPart) ?
        PartType.PROPERTY :
        PartType.ATTRIBUTE;
  }
}

export type{BooleanAttributePart};
class BooleanAttributePart {
  readonly type = PartType.BOOLEAN_ATTRIBUTE;
  readonly legacyPart: legacyLit.BooleanAttributePart

  get options(): legacyLit.RenderOptions|undefined {
    return undefined;
  }

  get name(): string {
    return this.legacyPart.name;
  }

  get element(): Element {
    return this.legacyPart.element;
  }

  /**
   * If this attribute part represents an interpolation, this contains the
   * static strings of the interpolation. For single-value, complete bindings,
   * this is undefined.
   */
  get strings() {
    return this.legacyPart.strings;
  }
  get tagName() {
    return this.element.tagName;
  }

  constructor(legacyPart: legacyLit.BooleanAttributePart) {
    this.legacyPart = legacyPart;
  }
}

/**
 * An AttributePart that manages an event listener via add/removeEventListener.
 *
 * This part works by adding itself as the event listener on an element, then
 * delegating to the value passed to it. This reduces the number of calls to
 * add/removeEventListener if the listener changes frequently, such as when an
 * inline function is used as a listener.
 *
 * Because event options are passed when adding listeners, we must take care
 * to add and remove the part as a listener when the event options change.
 */
export type{EventPart};
class EventPart {
  readonly type = PartType.EVENT;
  readonly legacyPart: legacyLit.EventPart;

  constructor(legacyPart: legacyLit.EventPart) {
    this.legacyPart = legacyPart;
  }

  get options(): legacyLit.RenderOptions|undefined {
    return undefined;
  }

  get name(): string {
    return this.legacyPart.eventName;
  }

  get element(): Element {
    return this.legacyPart.element;
  }

  /**
   * If this attribute part represents an interpolation, this contains the
   * static strings of the interpolation. For single-value, complete bindings,
   * this is undefined.
   */
  get strings() {
    return undefined;
  }
  get tagName() {
    return this.element.tagName;
  }

  handleEvent(event: Event) {
    this.legacyPart.handleEvent(event);
  }
}

// no equivalent for ElementPart in v1

function legacyPartToPart(part: legacyLit.Part): Part {
  if (part instanceof legacyLit.NodePart) {
    return new ChildPart(part);
  } else if (part instanceof legacyLit.EventPart) {
    return new EventPart(part);
  } else if (part instanceof legacyLit.BooleanAttributePart) {
    return new BooleanAttributePart(part);
  } else if (
      part instanceof legacyLit.PropertyPart ||
      part instanceof legacyLit.AttributePart) {
    return new AttributePart(part);
  }
  // ElementPartInfo doesn't exist in lit-html v1
  throw new Error(`Unknown part type`);
}

/**
 * Information about the part a directive is bound to.
 *
 * This is useful for checking that a directive is attached to a valid part,
 * such as with directive that can only be used on attribute bindings.
 */
export type PartInfo = ChildPartInfo|AttributePartInfo;

export interface DirectiveClass {
  new(part: PartInfo): Directive;
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
export type DirectiveResult<C extends DirectiveClass = DirectiveClass> = {
  /** @internal */
  _$litDirective$: C;
  /** @internal */
  values: DirectiveParameters<InstanceType<C>>;
};

/**
 * Base class for creating custom directives. Users should extend this class,
 * implement `render` and/or `update`, and then pass their subclass to
 * `directive`.
 */
export abstract class Directive {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(_partInfo: PartInfo) {
  }
  abstract render(...args: Array<unknown>): unknown;
  update(_part: Part, args: Array<unknown>): unknown {
    return this.render(...args);
  }
}

/**
 * Creates a user-facing directive function from a Directive class. This
 * function has the same parameters as the directive's render() method.
 *
 * N.B. In Lit 2, the directive will lose state if another directive is
 * executed on the same part as the directive instance is destroyed. This
 * version deviates from this behavior and will keep its state.
 */
export function directive<C extends DirectiveClass>(directiveClass: C) {
  const partToInstance =
      new WeakMap<legacyLit.Part, readonly[Part, InstanceType<C>]>();
  const result = legacyDirective((...args: unknown[]) => {
    return (part: legacyLit.Part) => {
      const cached = partToInstance.get(part);
      let modernPart, instance;
      if (cached === undefined) {
        modernPart = legacyPartToPart(part);
        instance = new directiveClass(modernPart) as InstanceType<C>;
        partToInstance.set(part, [modernPart, instance] as const );
      } else {
        modernPart = cached[0];
        instance = cached[1];
      }
      part.setValue(instance.update(modernPart, args));
      part.commit();
    };
  });

  return result as (...args: DirectiveParameters<InstanceType<C>>) =>
             (part: legacyLit.Part) => void;
}
