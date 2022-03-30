import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('element-b')
export class ElementB extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property()
  foo?: string;

  render() {
    return html`<h1>${this.foo}</h1>`;
  }
}
