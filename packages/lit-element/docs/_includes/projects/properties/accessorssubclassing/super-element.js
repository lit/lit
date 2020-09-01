import { LitElement, html } from 'lit-element';

export class SuperElement extends LitElement {
  static get properties() {
    return { prop: { type: Number } };
  }

  set prop(val) {
    let oldVal = this._prop;
    this._prop = Math.floor(val);
    this.requestUpdate('prop', oldVal);
  }

  get prop() { return this._prop; }

  constructor() {
    super();
    this._prop = 0;
  }

  render() {
    return html`  
      <p>prop: ${this.prop}</p>
      <button @click="${() => { this.prop = Math.random()*10; }}">
        change prop
      </button>
  `;
  }
}
customElements.define('super-element', SuperElement);
