import {html, css, LitElement} from 'lit';
import {styleMap} from 'lit/directives/style-map.js';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit-html/directives/repeat.js';
import '@lit-labs/virtualizer';
import type {LitVirtualizer} from '@lit-labs/virtualizer';

@customElement('x-repro')
export class XRepro extends LitElement {
  static styles = css`
    :host {
      display: contents;
      font-family: sans-serif;
    }
    .container {
      display: block;
      background: green;
    }
    .child {
      box-sizing: border-box;
      height: 37px;
      color: yellow;
      border: 1px solid yellow;
      width: 100%;
    }
    .controls > div {
      display: flex;
      align-items: center;
      gap: 0.25em;
    }
    .controls {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 1em;
      font-size: 0.8em;
    }
    .controls[fixed] {
      position: fixed;
      z-index: 100;
      top: 0;
    }
    input[type='number'] {
      width: 5em;
    }
  `;

  _options = 30000;
  _items;

  @property({type: String})
  scroller: 'list' | 'document' | 'ancestor' = 'ancestor';

  @property({type: Boolean})
  virtualize = true;

  @property({type: String})
  behavior: 'smooth' | 'instant' = 'instant';

  @property({type: String})
  block: 'start' | 'center' | 'end' | 'nearest' = 'start';

  constructor() {
    super();
    this._items = Array.from({length: this._options}, (_, index) => ({
      label: 'Option ' + index,
    }));
  }

  render() {
    const listIsScroller = this.scroller === 'list';
    const renderItem = (opt) => html`<div class="child">${opt.label}</div>`;
    const children = this.virtualize
      ? html`
          <lit-virtualizer
            class="container"
            ?scroller=${listIsScroller}
            style=${styleMap({
              height: listIsScroller ? '300px' : null,
            })}
            .items=${this._items}
            .renderItem=${renderItem}
          ></lit-virtualizer>
        `
      : listIsScroller
        ? html` <div
            class="container"
            style=${styleMap({height: '300px', overflow: 'auto'})}
          >
            ${repeat(this._items, renderItem)}
          </div>`
        : html` <div class="container">
            ${repeat(this._items, renderItem)}
          </div>`;

    return html`
      <form class="controls" ?fixed=${this.scroller === 'document'}>
        <div>
          <label for="virtualize">Virtualize:</label>
          <input
            type="checkbox"
            id="virtualize"
            ?checked=${this.virtualize}
            @change=${(e) => (this.virtualize = e.target.checked)}
          />
        </div>
        <div>
          <label for="scroller">Scroller:</label>
          <select
            id="scroller"
            @change=${(e) =>
              (this.scroller = e.target.value as
                | 'list'
                | 'document'
                | 'ancestor')}
          >
            <option value="list" ?selected=${this.scroller === 'list'}>
              List
            </option>
            <option value="document" ?selected=${this.scroller === 'document'}>
              Document
            </option>
            <option value="ancestor" ?selected=${this.scroller === 'ancestor'}>
              Ancestor
            </option>
          </select>
        </div>
        <div>
          <label for="block">Block:</label>
          <select
            id="block"
            @change=${(e) =>
              (this.block = e.target.value as
                | 'start'
                | 'center'
                | 'end'
                | 'nearest')}
          >
            <option value="start" ?selected=${this.block === 'start'}>
              Start
            </option>
            <option value="center" ?selected=${this.block === 'center'}>
              Center
            </option>
            <option value="end" ?selected=${this.block === 'end'}>End</option>
            <option value="nearest" ?selected=${this.block === 'nearest'}>
              Nearest
            </option>
          </select>
        </div>
        <div>
          <label for="behavior">Behavior:</label>
          <select
            id="behavior"
            @change=${(e) =>
              (this.behavior = e.target.value as 'smooth' | 'instant')}
          >
            <option value="instant" ?selected=${this.behavior === 'instant'}>
              Instant
            </option>
            <option value="smooth" ?selected=${this.behavior === 'smooth'}>
              Smooth
            </option>
          </select>
        </div>
        <div>
          <button type="submit" @click=${this.scrollToIndex}>Scroll to:</button>
          <input id="scrollTo" type="number" value="15000" />
        </div>
      </form>
      ${this.scroller === 'ancestor'
        ? html`
            <div style=${styleMap({height: '300px', overflow: 'auto'})}>
              <h2>Scrolling Ancestor</h2>
              <p>The scroller is an ancestor of the list.</p>
              ${children}
            </div>
          `
        : this.scroller === 'list'
          ? html`
              <h2>Scrolling List</h2>
              <p>The scroller is the list itself.</p>
              ${children}
            `
          : html`
              <h2 style="margin-top: 2em;">Scrolling Document</h2>
              <p>The scroller is the document.</p>
              ${children}
            `}
    `;
  }

  scrollToIndex(e) {
    e.preventDefault();
    const index = Number(
      (this.shadowRoot.getElementById('scrollTo') as HTMLInputElement).value
    );
    const options: ScrollIntoViewOptions = {
      behavior: this.behavior,
      block: this.block,
    };
    if (this.virtualize) {
      (this.shadowRoot.querySelector('lit-virtualizer') as LitVirtualizer)
        .element(index)
        .scrollIntoView(options);
    } else {
      const element = this.shadowRoot.querySelectorAll('.child')[index];
      element.scrollIntoView(options);
    }
  }
}
