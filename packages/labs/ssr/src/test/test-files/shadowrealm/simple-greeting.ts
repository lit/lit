import {html, css, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  static override styles = css`
    p {
      color: blue;
    }
  `;

  @property()
  name = 'Somebody';

  override render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
