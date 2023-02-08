import '../index.js';
import {css, html, LitElement} from 'lit';
import {property} from 'lit/decorators.js';

class DemoElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Try uncommenting this: */
      border: 2px solid black;
    }
  `;

  @property({type: Number}) rng = Math.random();

  render() {
    return html`
      <div>
        <div>Random number initialized in constructor: ${this.rng}</div>
        <!-- Can update this too: -->
        <label>Hello world</label>
      </div>
    `;
  }
}
customElements.define('demo-element', DemoElement);

declare global {
  interface HTMLElementTagNameMap {
    'demo-element': DemoElement;
  }
}

declare global {
  interface ImportMeta {
    hot: {
      accept(): void;
    };
  }
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
