import {html, css, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import '@lit-labs/virtualizer';

@customElement('simple-list')
export class SimpleList extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      max-height: 400px;
    }
    [hidden] {
      display: none !important;
    }
    .parent {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    main {
      overflow: auto;
      border: 1px solid green;
    }
  `;

  _interval: number;

  @property({attribute: false})
  items = Array.from({length: 1000 - 1 + 1}, (_, i) => i + 1);

  @property({type: Number})
  childCount = 0;

  @query('lit-virtualizer')
  list;

  @property({type: Boolean})
  hideList = false;

  connectedCallback() {
    super.connectedCallback();

    this._interval = setInterval(() => {
      this.childCount = this.list.querySelectorAll('div').length;
    }, 250) as unknown as number;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._interval);
  }

  render() {
    return html` <button @click=${this._hide}>Toggle visible</button>
      <div>Number of rendered items: ${this.childCount}</div>
      <div class="parent">
        <main .hidden=${this.hideList}>
          <lit-virtualizer
            .items=${this.items}
            .renderItem=${(item) => html`<div class"item">${item}</div>`}
          ></lit-virtualizer>
        </main>
      </div>`;
  }

  _hide() {
    this.hideList = !this.hideList;
  }
}
