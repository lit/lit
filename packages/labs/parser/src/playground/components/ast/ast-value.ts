import {html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import './ast-brackets.js';
import './ast-property.js';

@customElement('ast-value')
export class AstValue extends LitElement {
  @property({attribute: false}) data: unknown = null;
  @property({type: Number}) selectionStart = 0;
  @property({attribute: false}) propsToSkip: string[] = [];

  private getValueString(): string | undefined {
    if (typeof this.data === 'object' && this.data !== null) return undefined;
    if (typeof this.data === 'bigint') return String(this.data);
    return this.data == null ? String(this.data) : JSON.stringify(this.data);
  }

  private hasChildren(): boolean {
    return (
      typeof this.data === 'object' &&
      this.data !== null &&
      Object.keys(this.data).length > 0
    );
  }

  private handleChildAutofocused(autofocused: CustomEvent<boolean>) {
    this.dispatchEvent(
      new CustomEvent('autofocused', {detail: autofocused.detail})
    );
  }

  override render() {
    const value = this.getValueString();

    if (typeof this.data === 'object' && this.data !== null) {
      return html`
        <ast-brackets .data=${this.data}>
          ${this.hasChildren()
            ? html`<div style="margin-left: 12px">
                ${Object.entries(this.data).map(
                  ([key, value], index, array) => {
                    if (key === 'parentNode' || this.propsToSkip.includes(key))
                      return;
                    const isArray = Array.isArray(this.data);
                    const isLastItem = index === array.length - 1;
                    return html`
                      <ast-property
                        .propId=${key}
                        .value=${value}
                        .selectionStart=${this.selectionStart}
                        .isArrayItem=${isArray}
                        .isLastItem=${isLastItem}
                        .propsToSkip=${key === 'litHtmlExpression'
                          ? ['value']
                          : key === 'value'
                            ? ['litHtmlExpression']
                            : []}
                        .shouldTryStringify=${key === 'nodeName' ||
                        key === 'tagName' ||
                        key === 'value' ||
                        key === 'name'}
                        @autofocused=${this.handleChildAutofocused}
                      ></ast-property>
                    `;
                  }
                )}
              </div> `
            : ''}
        </ast-brackets>
      `;
    } else {
      return html`
        <span>
          <span>${value}</span>
          <span style="opacity: 0.7">,</span>
        </span>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ast-value': AstValue;
  }
}
