import {LitElement} from 'lit';
import {BaseHeader} from './base-header.js';
export class BaseAccordion extends LitElement {
  static isAccordion(x: EventTarget): x is BaseAccordion {
    return x instanceof this;
  }
  static isHeader(x: EventTarget): x is BaseAccordion {
    return x instanceof BaseHeader;
  }
}
