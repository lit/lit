import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  render(){
    return html`
      <div>
        <slot></slot>
      </div>
    `;
  }
}
customElements.define('my-element', MyElement);
