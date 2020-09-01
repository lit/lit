import { LitElement, html, css } from 'lit-element';

export class SuperElement extends LitElement {
  static get styles() {
    return css`
      button { width: 200px; }
    `;
  } 

  render() {
    return html`
      <button>click</button>
    `;
  }
}

customElements.define('super-element', SuperElement);
