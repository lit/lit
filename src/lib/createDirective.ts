import { Part, DetachHandler } from './part';
import { AttributePart, NodePart } from './parts';

const noop = () => {};

export type DirectiveUpdate<V extends any[]> = (...values: V) => void;

export type DirectiveUpdateAndDetach<V extends any[]> = {
  update?: (...values: V) => void,
  detach?: () => void,
};

export type DirectiveFn<V extends any[] = any[], P extends Part = Part> = (part: P) => DirectiveUpdate<V> | DirectiveUpdateAndDetach<V>;

export abstract class DirectiveResult<V extends any[], P extends Part = Part> {

  readonly values: V;

  readonly create: DirectiveFn<V, P>;

  constructor(values: V, create: DirectiveFn<V, P>) {
    this.values = values;
    this.create = create;
  }
}

export class DirectiveInstance<V extends any[], P extends Part = Part> {

  readonly part: P;

  readonly create: DirectiveFn<V, P>;

  readonly update: DirectiveUpdate<V>;

  readonly detach?: DetachHandler;

  constructor(part: P, create: DirectiveFn<V, P>) {
    this.part = part;
    this.create = create;
    const update = create(part);
    this.update = typeof update === 'function' ? update : update.update || noop;
    this.detach = typeof update === 'function' ? undefined : update.detach;
  }
}

export const isDirective = (x: any): x is DirectiveResult<any[]> => x instanceof DirectiveResult;

export function createDirective<V extends any[] = any[], P extends Part = Part>(create: DirectiveFn<V, P>): (...values: V) => DirectiveResult<V, P> {
  class Directive extends DirectiveResult<V, P> {}
  return (...values: V) => new Directive(values, create);
}

export const forAttributePart = <V extends any[]>(create: DirectiveFn<V, AttributePart>) => (part: AttributePart) => {
  if (part instanceof AttributePart) return create(part);
  throw new Error('This directive can only be used with attributes');
};

export const forNodePart = <V extends any[]>(create: DirectiveFn<V, NodePart>) => (part: NodePart) => {
  if (part instanceof NodePart) return create(part);
  throw new Error('This directive can only be used with text');
};