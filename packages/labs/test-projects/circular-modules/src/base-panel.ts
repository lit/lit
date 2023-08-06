import {LitElement} from 'lit';
import {BaseAccordion} from './base-accordion.js';
export class BasePanel extends LitElement {
  get hasAccordion() {
    return BaseAccordion.isAccordion(this.parentElement!);
  }
}
