import { LitElement, html, css } from 'lit-element';

class MyElement extends LitElement {
  render() { 
    return html`<p>Will also use Roboto</p>`; 
  }
}
customElements.define('my-element', MyElement);
