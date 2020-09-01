import { LitElement, html } from '@polymer/lit-element';

class MyElement extends LitElement {  

  firstUpdated() {
    let button = this.shadowRoot.getElementById('mybutton');
    button.addEventListener('click', this.doThing);
  }
  render() {
    return html`
      <button id="mybutton">click me</button>
    `;
  }
  doThing(e) {
    console.log(e);
  }
}

customElements.define('my-element', MyElement);
