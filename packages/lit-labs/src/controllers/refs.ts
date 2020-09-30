import { ATTRIBUTE_PART, directive, Directive, nothing, Part, PROPERTY_PART, UpdatingElement } from 'lit-element';

interface RefsDirectiveFunction {
  (name: string): void;
  [index: string]: unknown;
}

export const Refs = () => {

  const RefsDirective = class extends Directive {
    hasRef = false;
    render(_name: string) {
      return nothing;
    }
    update(part: Part, [name]: Parameters<this['render']>) {
      if (!(part.type === ATTRIBUTE_PART || part.type === PROPERTY_PART)) {
        throw new Error('The ref directive must be used in attribute or property position.');
      }
      if (!this.hasRef) {
        this.hasRef = true;
        (refs as unknown as RefsDirectiveFunction)[name] = part.element;
      }
      return this.render(name);
    }
  }

  const refs = directive(RefsDirective);
  return refs;
}

export const getRefsUpdateComplete = async (refs: RefsDirectiveFunction) => {
  for (const r of Object.values(refs)) {
    await (r as unknown as UpdatingElement).updateComplete;
  }
}
