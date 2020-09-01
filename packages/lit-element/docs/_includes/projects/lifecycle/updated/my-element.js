import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() {
    return {
      prop1: { type: Number },
      prop2: { type: Number }
    };
  }
  constructor() {
    super();
    this.prop1 = 0;
    this.prop2 = 0;
  }
  render() {
    return html`
      <style>button:focus { background-color: aliceblue; }</style>

      <p>prop1: ${this.prop1}</p>
      <p>prop2: ${this.prop2}</p>

      <button id="a" @click="${() => this.prop1=Math.random()}">prop1</button>
      <button id="b" @click="${() => this.prop2=Math.random()}">prop2</button>
    `;
  }
  updated(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      console.log(`${propName} changed. oldValue: ${oldValue}`);
    });
    let b = this.shadowRoot.getElementById('b');
    b.focus();
  }
}
customElements.define('my-element', MyElement);
