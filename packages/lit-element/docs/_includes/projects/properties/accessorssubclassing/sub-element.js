import { SuperElement } from './super-element.js';

class SubElement extends SuperElement {  
  static get properties() { 
    return { prop: { reflect: true, noAccessor: true } };
  }
}

customElements.define('sub-element', SubElement);
