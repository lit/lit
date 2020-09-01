import { LitElement, html } from '@polymer/lit-element';

class MyElement extends LitElement {  
  firstUpdated() {
    this.addEventListener('click', this.clickHandler);
  }
  clickHandler(e) {
    console.log(e.target);
  }
  render() {
    return html`
      <p>Click me</p>
    `;
  }
}

customElements.define('my-element', MyElement);
