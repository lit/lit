import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import type {Directive, Statement} from 'oxc-parser';
import type {
  LitLinkedExpression,
  LitTaggedTemplateExpression,
} from '../../../lib/lib/ast/tree-adapter.js';
import '../ast/ast-property.js';

@customElement('estree-panel')
export class EstreePanel extends LitElement {
  @property({attribute: false}) oxc:
    | (
        | Directive
        | Statement
        | LitTaggedTemplateExpression
        | LitLinkedExpression
      )[]
    | null = null;
  @property({type: Number}) selectionStart = 0;

  override render() {
    return html`
      <div style="width: 100%; overflow: auto; padding: 8px;">
        <div
          style="padding-top: 8px; font-size: 14px; line-height: 1.5; font-family: monospace;"
        >
          <ast-property
            .value=${this.oxc}
            .selectionStart=${this.selectionStart}
          ></ast-property>
        </div>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      background-color: #fbfdff;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'estree-panel': EstreePanel;
  }
}
