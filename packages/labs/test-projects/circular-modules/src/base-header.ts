import {LitElement} from 'lit';
import {BaseAccordion} from './base-accordion.js';
export class HeaderChangeEvent extends Event {
  constructor(public accordion: BaseAccordion) {
    super('change');
  }
}
export class BaseHeader extends LitElement {
  get hasAccordion() {
    return BaseAccordion.isAccordion(this.parentElement!);
  }
  onChange() {
    if (this.hasAccordion)
      this.dispatchEvent(
        new HeaderChangeEvent(this.parentElement as BaseAccordion)
      );
  }
}
