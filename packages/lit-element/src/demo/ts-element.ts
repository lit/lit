import {html, css, LitElement} from '../lit-element.js';
import {property} from '../lib/decorators/property.js';

class TSElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 8px;
    }
  `;

  @property() message = 'Hi';

  @property({
    attribute: 'more-info',
    converter: (value: string | null) => `[${value}]`,
  })
  extra = '';

  render() {
    const {message, extra} = this;
    return html`
      ${html`<style>
        :host {
          background: steelblue;
        }
      </style>`}
      TSElement says: ${message} ${extra}
    `;
  }
}
customElements.define('ts-element', TSElement);
