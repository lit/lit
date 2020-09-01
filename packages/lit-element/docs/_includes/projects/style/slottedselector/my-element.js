import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      ::slotted(*) { font-family: Roboto; }
      ::slotted(p) { color: blue; }
      div ::slotted(*) { color: red; }
    `;
  }
  render() {
    return html`
      <slot></slot>
      <div><slot name="hi"></slot></div>
    `;
  }
}
customElements.define('my-element', MyElement);
