import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('my-tabs')
export class MyTabs extends LitElement {
  render() {
    return html` <nav>
      <ul>
        <slot></slot>
      </ul>
    </nav>`;
  }

  static styles = css`
    :host {
      display: block;
    }

    slot {
      display: flex;
    }

    ul {
      list-style-type: none;
      margin: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'my-tabs': MyTabs;
  }
}
