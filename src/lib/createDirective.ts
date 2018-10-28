import { Part } from "./part";

export type DirectiveUpdate<P extends any[]> = (...params: P) => void;
export type DirectiveFn<P extends any[]> = (part: Part) => DirectiveUpdate<P>;

export abstract class DirectiveResult<P extends any[]> {

  readonly params: P

  readonly create: DirectiveFn<P>

  constructor(params: P, create: DirectiveFn<P>){
    this.params = params;
    this.create = create;
  }
};

export class DirectiveInstance<P extends any[]> {

  readonly part: Part

  readonly create: DirectiveFn<P>

  readonly update: DirectiveUpdate<P>;

  constructor(part: Part, create: DirectiveFn<P>, update: DirectiveUpdate<P>){
    this.part = part;
    this.create = create;
    this.update = update;
  }
}

export const isDirective = (x: any): x is DirectiveResult<any[]> => x instanceof DirectiveResult;

export default function createDirective<P extends any[]>(create: DirectiveFn<P>): (...params: P) => DirectiveResult<P> {
  class Directive extends DirectiveResult<P> {};
  return (...params: P) => new Directive(params, create);
}

