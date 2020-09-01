import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      button { width: var(--buttonWidth, 100px); }
    `;
  }
  render() {
    return html`<button>click</button>`;
  }
}

customElements.define('my-element', MyElement);
