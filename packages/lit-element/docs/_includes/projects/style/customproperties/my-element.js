import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      :host { 
        background-color: var(--myBackground, yellow);
        color: var(--myColor, black);
        padding: var(--myPadding, 8px);
      }
    `;
  }
  render() {
    return html`<p>Hello world</p>`;
  }
}
customElements.define('my-element', MyElement);
