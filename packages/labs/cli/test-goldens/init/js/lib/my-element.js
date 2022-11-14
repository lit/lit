import {LitElement, html, css} from 'lit';

/**
 * An example element.
 *
 * @fires count-changed - Indicates when the count changes
 * @slot - This element has a slot
 * @csspart button - The button
 * @cssprop --my-element-font-size - The button's font size
 */
export class MyElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
    }

    button {
      font-size: var(--my-element-font-size, 16px);
    }
  `;

  static properties = {
    /**
     * The number of times the button has been clicked.
     * @type {number}
     */
    count: {type: Number},
  }

  constructor() {
    super();
    this.count = 0;
  }

  render() {
    return html`
      <h1>Hello World</h1>
      <button @click=${this._onClick} part="button">
        Click Count: ${this.count}
      </button>
      <slot></slot>
    `;
  }

  _onClick() {
    this.count++;
    const event = new Event('count-changed', {bubbles: true});
    this.dispatchEvent(event);
  }
}

customElements.define('my-element', MyElement);
