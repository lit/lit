import {html, LitElement} from 'lit';
class A extends LitElement {
  static properties = {
    name: {type: String},
  };
  name: string;
  constructor() {
    super();
    this.name = 'Somebody';
  }
  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
customElements.define('x-el', A);
