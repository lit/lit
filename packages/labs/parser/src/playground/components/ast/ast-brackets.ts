import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('ast-brackets')
export class AstBrackets extends LitElement {
  @property({attribute: false}) data: unknown = null;

  override render() {
    const isArray = Array.isArray(this.data);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    return html`
      <span>
        <span style="opacity: 0.7">${openBracket}</span>
        <slot></slot>
        <span style="opacity: 0.7">${closeBracket}</span>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ast-brackets': AstBrackets;
  }
}
