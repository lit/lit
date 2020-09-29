import { ATTRIBUTE_PART, directive, Directive, nothing, Part, PROPERTY_PART, UpdatingElement } from 'lit-element';

export class Refs {
  [index: string]: any;

  // TODO(sorvell): how to type this?
  _directive?: any;

  getRef(name: string) {
    if (this._directive === undefined) {
      const refs = this;
      const RefDirective = class extends Directive {
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
            refs[name] = part.element;
          }
          return this.render(name);
        }
      }
      this._directive = directive(RefDirective);
    }
    return this._directive(name);
  }

  getUpdateComplete() {
    return Promise.all(Object.values(this).map(r => (r as UpdatingElement).updateComplete));
  }

}
