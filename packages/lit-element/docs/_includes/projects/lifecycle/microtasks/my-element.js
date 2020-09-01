import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {

  render() {
    return html`
      <button @click="${this.doThing}">doThing</button>
    `;
  }

  doThing() {
    console.log('doing a thing.');
  }
}
customElements.define('my-element', MyElement);
