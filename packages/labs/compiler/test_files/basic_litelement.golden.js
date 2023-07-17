import {html, LitElement} from 'lit';
const lit_template_1 = {
  h: ((i) => i)`<p>Hello, <?>!</p>`,
  parts: [{type: 2, index: 1}],
};
class A extends LitElement {
  static properties = {
    name: {type: String},
  };
  name;
  constructor() {
    super();
    this.name = 'Somebody';
  }
  render() {
    return {_$litType$: lit_template_1, values: [this.name]};
  }
}
customElements.define('x-el', A);
