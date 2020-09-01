import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      :host([hidden]) { display: none; }
      :host {
        display: block;
        font-family: Roboto;
        font-size: 20;
        color: blue;
      }
    `;
  }
  render() {
    return html`
      <p>Inherits font styles from host</p>
    `;
  }
}
customElements.define('my-element', MyElement);
