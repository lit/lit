import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

/**
 * @fires my-event {MyEvent} My special event
 */
@customElement('element-a')
export class ElementA extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<h2>This is a Lit element</h2>`
  }
}
