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
      <p>prop1: ${this.prop1}</p>
      <p>prop2: ${this.prop2}</p>
      <button @click="${() => this.prop1=this.change()}">Change prop1</button>
      <button @click="${() => this.prop2=this.change()}">Change prop2</button>
    `;
  }

  /**
   * Only update element if prop1 changed.
   */
  shouldUpdate(changedProperties) {
    changedProperties.forEach((oldValue, propName) => {
      console.log(`${propName} changed. oldValue: ${oldValue}`);
    });
    return changedProperties.has('prop1');
  }

  change() {
    return Math.floor(Math.random()*10);
  }
}
customElements.define('my-element', MyElement);
