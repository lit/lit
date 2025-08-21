import {css, html, LitElement, PropertyValues} from 'lit';
import {customElement, property, state, query} from 'lit/decorators.js';
import './ast-summary-value.js';
import './ast-value.js';
import {getHighlightColor} from '../../utils/shiki.js';
import {
  LitHtmlExpression,
  LitTagLiteral,
} from '../../../lib/ast/html-parser/parse5-shim.js';

// Determines whether selectionStart is in range
function inRange(value: unknown, selectionStart: number): boolean {
  if (
    value &&
    typeof value === 'object' &&
    'start' in value &&
    'end' in value
  ) {
    const start = (value as Record<string, unknown>).start as number;
    const end = (value as Record<string, unknown>).end as number;
    return selectionStart >= start && selectionStart <= end;
  }

  // Check for sourceCodeLocation format
  if (value && typeof value === 'object' && 'sourceCodeLocation' in value) {
    const location = (value as Record<string, unknown>).sourceCodeLocation as {
      startOffset: number;
      endOffset: number;
    };
    return (
      selectionStart >= location.startOffset &&
      selectionStart <= location.endOffset
    );
  }

  if (Array.isArray(value)) {
    return Array.from(value).some((v) => inRange(v, selectionStart));
  }

  return false;
}

export function stringifyLiteralExpressionArray(
  expressions: (LitTagLiteral | LitHtmlExpression)[]
) {
  let output = '';

  if (!Array.isArray(expressions)) {
    return expressions;
  }
  for (const expression of expressions) {
    if (expression.type === 'LitTagLiteral') {
      output += expression.value;
    } else {
      output += '${...}';
    }
  }

  return output.replaceAll('\n', '\\n');
}

@customElement('ast-property')
export class AstProperty extends LitElement {
  @property({attribute: false}) propId?: string | number = undefined;
  @property({attribute: false}) value?: unknown;
  @property({type: Boolean}) root = false;
  @property({type: Boolean}) open = false;
  @property({type: Number}) selectionStart = 0;
  @property({type: Boolean}) isArrayItem = false;
  @property({type: Boolean}) isLastItem = false;
  @property({attribute: false}) propsToSkip: string[] = [];
  @property({type: Boolean}) shouldTryStringify = false;

  @state() private openManual: boolean | null = null;
  @state() private exactAutofocused = false;
  @state() private titleColor = '';
  @state() private keyStringColor = '';
  @state() private autofocused = false;

  @query('.container') container?: HTMLDivElement;

  // Computed properties
  private get propTitle(): string | undefined {
    if (this.value && typeof this.value === 'object' && 'type' in this.value) {
      return (this.value as Record<string, unknown>).type as string;
    }
    if (
      this.value &&
      typeof this.value === 'object' &&
      'nodeName' in this.value
    ) {
      const nodeName = (this.value as Record<string, unknown>).nodeName as
        | string
        | (LitTagLiteral | LitHtmlExpression)[];
      return Array.isArray(nodeName)
        ? stringifyLiteralExpressionArray(nodeName)
        : nodeName;
    }
    return '';
  }

  private get openable(): boolean {
    return (
      typeof this.value === 'object' &&
      this.value != null &&
      Object.keys(this.value as object).length > 0
    );
  }

  override willUpdate(changed: PropertyValues) {
    if (changed.has('selectionStart')) {
      this.autofocused = inRange(this.value, this.selectionStart);
      this.dispatchEvent(
        new CustomEvent('autofocused', {
          detail: this.autofocused,
        })
      );
    }

    if (changed.has('propId') || changed.has('value')) {
      const title = this.propTitle;
      if (title) {
        const lang = title.startsWith('#') ? 'css' : 'typescript';
        getHighlightColor(`${title}()`, lang).then((color) => {
          this.titleColor = color;
        });
      }
      if (this.keyString) {
        getHighlightColor(this.keyString, 'typescript').then(
          (color) => (this.keyStringColor = color)
        );
      }
    }
  }

  private get isOpen(): boolean {
    return (
      (this.openable && this.openManual) ||
      (this.openManual === null && this.autofocused)
    );
  }

  private get keyString(): string | undefined {
    return this.propId !== undefined ? String(this.propId) : undefined;
  }

  private get keyClass(): string {
    return this.openable ? 'cursor-pointer' : '';
  }

  // Event handlers
  private toggleOpen(): void {
    if (!this.openable) return;

    // Simply toggle the openManual state
    this.openManual = !this.isOpen;
  }

  private handleSubAutofocus(event: CustomEvent<boolean>): void {
    const subAutofocused = event.detail;
    this.exactAutofocused = this.autofocused && !subAutofocused;

    // Propagate the hover state up
    this.dispatchEvent(
      new CustomEvent('autofocused', {
        detail: this.autofocused,
      })
    );
  }

  override render() {
    return html`
      <div
        class="container ${this.openManual === null && this.exactAutofocused
          ? 'ast-highlight'
          : ''} ${this.isArrayItem ? 'array-item' : ''}"
      >
        ${this.openable
          ? html`
              <span class="toggle-indicator"> ${this.isOpen ? '-' : '+'} </span
              >&nbsp;
            `
          : ''}
        ${!this.openable && !this.isArrayItem ? html`&nbsp;` : ''}
        ${this.keyString && !this.isArrayItem
          ? html`
              <span
                class="${this.keyClass}"
                style="color: ${this.keyStringColor}"
                @click=${this.toggleOpen}
              >
                ${this.keyString}
              </span>
              <span class="separator">:</span>
            `
          : ''}${this.propTitle
          ? html`
              <span
                class="${this.keyClass}"
                style="color: ${this.titleColor}"
                @click=${this.toggleOpen}
              >
                ${this.propTitle}
              </span>
            `
          : ''}${!this.openable || this.isOpen
          ? html`
              <ast-value
                .data=${this.value}
                .propsToSkip=${this.propsToSkip}
                @autofocused=${this.handleSubAutofocus}
                .selectionStart=${this.selectionStart}
              ></ast-value>
            `
          : ''}${this.openable && !this.isOpen
          ? html`
              <ast-summary-value
                .data=${this.value}
                @toggle=${this.toggleOpen}
                .selectionStart=${this.selectionStart}
                .tryStrinfigy=${this.shouldTryStringify}
              ></ast-summary-value>
            `
          : ''}${this.isArrayItem
          ? html`<span style="opacity: 0.7">,</span>`
          : ''}
      </div>
    `;
  }

  static override styles = css`
    .container {
      position: relative;
      width: fit-content;
      font-family: monospace;
      display: block;
    }

    .ast-highlight {
      border: 1px solid #60a5fa33;
    }

    .array-item {
      margin-left: 0;
    }

    .toggle-indicator {
      position: absolute;
      left: -3.5px;
      user-select: none;
      font-size: 14px;
      font-weight: 600;
      opacity: 0.7;
    }

    .toggle-indicator:is(:where(.open)) {
      color: rgb(248, 113, 113);
    }

    .toggle-indicator:is(:where(:not(.open))) {
      color: rgb(74, 222, 128);
    }

    .separator {
      opacity: 0.7;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .cursor-pointer:hover {
      text-decoration: underline;
    }

    :host {
      white-space: nowrap;
    }
  `;
}

// Expose the component to the global scope
declare global {
  interface HTMLElementTagNameMap {
    'ast-property': AstProperty;
  }
}

// Export utility functions for other components to use
export {inRange};
