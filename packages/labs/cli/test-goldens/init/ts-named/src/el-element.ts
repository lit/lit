import {LitElement, html, css} from 'lit';
import {property, customElement} from 'lit/decorators.js';

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 * @cssprop --el-element-font-size - The button's font size
 */
@customElement('el-element')
export class ElElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
    }

    button {
      font-size: var(--el-element-font-size, 16px);
    }
  `;

  /**
   * The number of times the button has been clicked.
   */
  @property({type: Number})
  count = 0;

  render() {
    return html`
      <h1>Hello World</h1>
      <button @click=${this._onClick} part="button">
        Click Count: ${this.count}
      </button>
      <slot></slot>
    `;
  }

  protected _onClick() {
    this.count++;
    const event = new Event('count-changed', {bubbles: true});
    this.dispatchEvent(event);
  }
}
