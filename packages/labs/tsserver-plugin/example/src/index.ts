import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('my-element')
export class MyElement extends LitElement {
  static styles = css`
    :host {
      color: blue;
    }
  `;

  @property({type: String})
  name = 'World';

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
