import { LitElement, html } from 'lit-element';

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
    this.prop3 = true;
    this.prop4 = [1,2,3];
    this.prop5 = { stuff: 'hi', otherStuff: 'wow' };
  }

  render() {
    return html`
      <p>prop1: ${this.prop1}</p>
      <p>prop2: ${this.prop2}</p>
      <p>prop3: ${this.prop3}</p>

      <p>prop4: ${this.prop4.map((item, index) =>
        html`<span>[${index}]:${item}&nbsp;</span>`)}
      </p>

      <p>prop5:
        ${Object.keys(this.prop5).map(item =>
          html`<span>${item}: ${this.prop5[item]}&nbsp;</span>`)}
      </p>
    `;
  }
}
customElements.define('my-element', MyElement);
