import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * @fires my-event {MyEvent} My special event
 */
@customElement('element-a')
export class ElementA extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    main {
      border: solid 1px red;
      border-radius: 5px;
      padding: 8px;
    }
  `;

  @property({type: Number})
  foo = 42;

  render() {
    return html`
      <h2>This is a Lit element</h2>
      <code>foo is ${this.foo}</code>
      <h3>These are children</h3>
      <main><slot></slot></main>
    `;
  }
}
