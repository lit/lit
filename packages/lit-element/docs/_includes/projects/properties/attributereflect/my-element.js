import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() { return {
    myProp: { reflect: true }
  };}

  constructor() {
    super();
    this.myProp='myProp';
  }

  attributeChangedCallback(name, oldval, newval) {
    console.log('attribute change: ', newval);
    super.attributeChangedCallback(name, oldval, newval);
  }

  render() {
    return html`
      <p>${this.myProp}</p>

      <button @click="${this.changeProperty}">change property</button>
    `;
  }

  changeProperty() {
    let randomString = Math.floor(Math.random()*100).toString();
    this.myProp='myProp ' + randomString;
  }

}
customElements.define('my-element', MyElement);
