import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() { return { prop1: { type: Object } }; }
  constructor() {
    super();
    this.prop1 = { subProp: 0 }
  }
  render() {
    return html`
      <p>prop1.subProp: ${this.prop1.subProp}</p>
      <button @click="${this.change}">change</button>
    `;
  }
  change() {
    let newVal = Math.random();
    /**
     * Changes to object subproperties and array items are not observable.
     * Instead:
     */

    // Option 1: Rewrite the whole object, triggering an update
    // this.prop1 = Object.assign({}, this.prop1, { subProp: newVal });

    // Option 2: Mutate a subproperty, then call requestUpdate
    this.prop1.subProp = newVal;
    this.requestUpdate();
  }
}
customElements.define('my-element', MyElement);
