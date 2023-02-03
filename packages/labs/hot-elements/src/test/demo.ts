import '../index.js';
import {css, html, LitElement} from 'lit';

class DemoElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      /* Try uncommenting this: */
      border: 2px solid black;
    }
  `;

  render() {
    return html`
      <div>
        <!-- Can update this too: -->
        Updated render!!!!
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
