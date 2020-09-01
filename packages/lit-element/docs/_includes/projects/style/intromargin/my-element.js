import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      :host { display: block; }
    `;
  }
  render() {
    return html`<p>Hello world</p>`;
  }
}

customElements.define('my-element', MyElement);
