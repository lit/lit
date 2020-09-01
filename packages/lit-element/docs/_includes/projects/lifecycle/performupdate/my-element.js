import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() { return { prop1: { type: Number } }; }

  constructor() {
    super();
    this.prop1 = 0;
  }

  render() {
    return html`
      <p>prop1: ${this.prop1}</p>
      <button @click="${() => this.prop1=this.change()}">Change prop1</button>
    `;
  }

  async performUpdate() {
    console.log('Requesting animation frame...');
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    console.log('Got animation frame. Performing update');
    super.performUpdate();
  }

  change() {
    return Math.floor(Math.random()*10);
  }
}
customElements.define('my-element', MyElement);
