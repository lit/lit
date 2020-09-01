import { LitElement, html } from 'lit-element';

class MyHeader extends LitElement {
  render() {
    return html`
      <header>header</header>
    `;
  }
}
customElements.define('my-header', MyHeader);
