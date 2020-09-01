import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('my-element', MyElement);
