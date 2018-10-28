import { Part } from "./part";

export type DirectiveFn<P extends any[]> = (part: Part) => (...params: P) => void;

export abstract class DirectiveResult<P extends any[]> {

  readonly params: P

  readonly create: DirectiveFn<P>

  constructor(params: P, create: DirectiveFn<P>){
    this.params = params;
    this.create = create;
  }
};

export const isDirective = (x: any): x is DirectiveResult<any[]> => x instanceof DirectiveResult;

export default function createDirective<P extends any[]>(create: DirectiveFn<P>): (...params: P) => DirectiveResult<P> {
  class Directive extends DirectiveResult<P> {};
  return (...params: P) => new Directive(params, create);
}

