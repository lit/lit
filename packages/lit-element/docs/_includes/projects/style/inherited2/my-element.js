import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  render() { 
    return html`<p>Will use Roboto</p>`; 
  }
}
customElements.define('my-element', MyElement);
