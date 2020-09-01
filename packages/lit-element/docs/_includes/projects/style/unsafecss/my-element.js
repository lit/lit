import { LitElement, html, css, unsafeCSS } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    const mainColor = 'red';

    return css`
      div { color: ${unsafeCSS(mainColor)} }
    `;
  }
  render() {
    return html`<div>Some content in a div</div>`;
  }
}

customElements.define('my-element', MyElement);
