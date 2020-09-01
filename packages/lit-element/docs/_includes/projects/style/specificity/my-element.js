import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  static get styles() { 
    return css`
      :host { font-family: Roboto; }
    `;
  }
  render() {
    return html`<p>Will use Courier</p>`;
  }
}
customElements.define('my-element', MyElement);
