import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('test-element')
export class TestElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<p>Hello world!</p>`;
  }
}
