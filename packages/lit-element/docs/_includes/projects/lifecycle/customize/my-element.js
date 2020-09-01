import {LitElement, html} from 'lit-element';

class MyElement extends LitElement {
  static get properties() {
    return {
      prop1: {type: String},
    };
  }

  constructor() {
    console.log('constructor');
    super();
    this.prop1 = 'hi';
  }

  connectedCallback() {
    console.log('connectedCallback');
    super.connectedCallback();
  }

  render() {
    console.log('render');
    return html`<p>${this.prop1}</p>`;
  }

  firstUpdated() {
    console.log('firstUpdated');
  }
}

customElements.define('my-element', MyElement);
