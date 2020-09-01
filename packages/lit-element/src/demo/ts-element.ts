import {html, LitElement} from '../lit-element.js';
import {property} from '../lib/decorators.js';

class TSElement extends LitElement {
  @property() message = 'Hi';

  @property(
      {attribute: 'more-info', converter: (value: string|null) => `[${value}]`})
  extra = '';

  render() {
    const {message, extra} = this;
    return html`
      <style>
        :host {
          display: block;
        }
      </style>TSElement says: ${message} ${extra}
    `;
  }
}
customElements.define('ts-element', TSElement);