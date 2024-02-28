import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('element-two')
export class ElementTwo extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({type: Boolean})
  conditional? = true;

  render() {
    return html`
      <h1>Element Two</h1>
      <p>
        ${this.conditional ? html`<span>Yes</span>` : html`<span>No</span>`}
      </p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'element-two': ElementTwo;
  }
}
