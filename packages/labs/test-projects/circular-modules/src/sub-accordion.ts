import {BaseAccordion} from './base-accordion.js';
import {BaseHeader} from './base-header.js';
export * from './sub-header.js';
export * from './sub-panel.js';
export class SubAccordion extends BaseAccordion {
  get header() {
    return [...this.children].find((x) => x instanceof BaseHeader);
  }
}
customElements.define('sub-accordion', SubAccordion);
