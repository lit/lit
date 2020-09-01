import { LitElement, html } from '@polymer/lit-element';

class MyElement extends LitElement {  
  render() {
    return html`
      <button @click="${this.doThing}">click me</button>
    `;
  }
  doThing(e) {
    console.log(e);
  }
}

customElements.define('my-element', MyElement);
