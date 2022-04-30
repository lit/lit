import {LitElement, html, css} from 'lit';

/**
 * @fires my-event {MyEvent} My special event
 */
export class ElementA extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`<h1>This is an element</h1>`
  }
}
