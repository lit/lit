import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  render() {
    return html`
      <link rel="stylesheet" href="./app-styles.css">
      <button>a button</button>
      <div>a div</div>
    `;
  }
}

customElements.define('my-element', MyElement);
