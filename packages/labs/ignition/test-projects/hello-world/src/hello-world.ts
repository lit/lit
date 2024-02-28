import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './element-two.js';

@customElement('hello-world')
export class HelloWorld extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    h1 {
      background: #8888ff;
    }
  `;

  @property()
  name = 'World';

  render() {
    return html`
      <h1>Hello, ${this.name}!</h1>
      Element two instance: <element-two></element-two>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hello-world': HelloWorld;
  }
}
