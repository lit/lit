import { LitElement, html } from '@polymer/lit-element';

class MyElement extends LitElement {
  static get properties() { return {
    prop1: { type: String },
    prop2: { type: Number },
    prop3: { type: Boolean },
    prop4: { type: Array },
    prop5: { type: Object }
  };}

  constructor() {
    super();
    this.prop1 = 'Hello World';
    this.prop2 = 5;
    this.prop3 = false;
    this.prop4 = [1,2,3];
    this.prop5 = { subprop1: 'prop 5 subprop1 value' }
  }

  render() {
    return html`
      <p>prop1: ${this.prop1}</p>
      <p>prop2: ${this.prop2}</p>
      <p>prop3: ${this.prop3}</p>
      <p>prop4[0]: ${this.prop4[0]}</p>
      <p>prop5.subprop1: ${this.prop5.subprop1}</p>
    `;
  }
}

customElements.define('my-element', MyElement);
