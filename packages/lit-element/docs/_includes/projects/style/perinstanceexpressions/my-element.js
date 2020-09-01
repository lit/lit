import { LitElement, html } from 'lit-element';

const perClassStyle = html`
  <style>
    :host {
      display: block;
      font-family: Roboto;
      font-size: 14px; 
    }
  </style>
`;

const blueText = html`
  <style> :host { color: blue; } </style>
`;

const redText = html`
  <style> :host { color: red; } </style>
`;

class MyElement extends LitElement {
  constructor() {
    super();
    this.perInstanceStyle = redText;
  }
  render() {
    return html`
      ${perClassStyle}
      ${this.perInstanceStyle}
      <div>Hello World</div>
    `;
  }
}

customElements.define('my-element', MyElement);
