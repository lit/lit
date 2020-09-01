import { css } from 'lit-element';
import { SuperElement } from './super-element.js';

class MyElement extends SuperElement {
  static get styles() {
    return [
      super.styles,
      css`button { color: red; }`
    ];
  } 
}

customElements.define('my-element', MyElement);
