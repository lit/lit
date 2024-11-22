import '@lit-labs/virtualizer';
import {html, css, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';

const smallItem = (_, i) => `Item ${i}`;
const largeItem = (_, i) =>
  `${i}: Cillum amet culpa labore tempor occaecat eu irure duis pariatur sunt minim aliquip quis pariatur. Laborum nisi ad nostrud ad aliqua aute enim exercitation. Amet cupidatat Lorem deserunt do ullamco dolore duis sit consequat occaecat tempor. Deserunt velit Lorem voluptate occaecat ut sunt officia. Elit nisi ea cillum esse minim culpa nisi minim irure.`;
const randomItem = (_, i) =>
  Math.random() > 0.5 ? smallItem(_, i) : largeItem(_, i);
const genItems = (
  n: number = 500,
  itemFn: (item, index: number) => string = largeItem
) => Array.from({length: n}, itemFn);

@customElement('simple-greeting')
export class SimpleGreeting extends LitElement {
  static styles = css`
    :host {
      background: lightblue;
    }

    lit-virtualizer {
      background: hotpink;
    }

    #buttons {
      position: fixed;
      width: calc(100vw - 24px);
      padding: 0 8px;
      z-index: 100;
      display: flex;
      justify-content: right;
      gap: 4px;
    }
  `;

  @state() items = genItems();

  render() {
    return html`
      <div id="buttons">
        <button @click=${() => this.#replaceItems(1, largeItem)}>
          One large
        </button>
        <button @click=${() => this.#replaceItems(1, smallItem)}>
          One small
        </button>
        <button @click=${() => this.#replaceItems(500, largeItem)}>
          All large
        </button>
        <button @click=${() => this.#replaceItems(500, smallItem)}>
          All small
        </button>
        <button @click=${() => this.#replaceItems(500, randomItem)}>
          Random
        </button>
        <button @click=${this.#removeItems}>Remove half</button>
      </div>
      <lit-virtualizer
        .items=${this.items}
        .renderItem=${(item) => html`<div>${item}</div>`}
      ></lit-virtualizer>
    `;
  }

  #replaceItems(n: number, itemFn: (item, index: number) => string) {
    this.items = genItems(n, itemFn);
  }

  #removeItems() {
    this.items = this.items.slice(0, Math.floor(this.items.length / 2));
  }
}
