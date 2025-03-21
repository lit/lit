import {html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import './ast-brackets.js';
import {stringifyLiteralExpressionArray} from './ast-property.js';

@customElement('ast-summary-value')
export class AstSummaryValue extends LitElement {
  @property({attribute: false}) data: unknown = null;
  @property({type: Number}) selectionStart = 0;
  @property({type: Boolean}) tryStrinfigy = false;
  @state() private isHovering = false;

  private getContentSummary(): string {
    if (Array.isArray(this.data)) {
      const len = this.data.length;
      return `${len} element${len === 1 ? '' : 's'}`;
    } else if (this.data && typeof this.data === 'object') {
      const keys = Object.keys(this.data);
      const len = keys.length;
      return keys.slice(0, 5).join(', ') + (len > 5 ? `, ... +${len - 5}` : '');
    }
    return '';
  }

  private handleClick() {
    this.dispatchEvent(new CustomEvent('toggle'));
  }

  private handleMouseEnter() {
    this.isHovering = true;
  }

  private handleMouseLeave() {
    this.isHovering = false;
  }

  override render() {
    return html`
      <ast-brackets .data=${this.data}>
        <span
          @click=${this.handleClick}
          @mouseenter=${this.handleMouseEnter}
          @mouseleave=${this.handleMouseLeave}
          style="cursor: pointer; font-style: italic; opacity: 0.7; text-decoration: ${this.isHovering ? 'underline' : 'none'};"
          >${this.tryStrinfigy ? stringifyLiteralExpressionArray(this.data as []) : this.getContentSummary()}</span>
        </span>
      </ast-brackets>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ast-summary-value': AstSummaryValue;
  }
}
