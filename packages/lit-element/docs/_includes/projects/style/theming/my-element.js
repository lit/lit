import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() { 
    return css`
      :host { 
        display: block;
        color: var(--my-element-text-color, black); 
        background: var(--my-element-background-color, white);  
        font-family: var(--my-element-font-family, Roboto);
      }
      :host([hidden]) {
        display: none;
      }
    `;
  }
  render() {
    return html`<div>Hello World</div>`;
  }
}
customElements.define('my-element', MyElement);
