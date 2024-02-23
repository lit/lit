import {html, css, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('element-two')
export class ElementTwo extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<h1>Element Two</h1>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'element-two': ElementTwo;
  }
}
