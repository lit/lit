import {LitElement, html, css, PropertyValues} from '../lit-element.js';

class Inner extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          color: green;
        }
      `,
    ];
  }
  render() {
    return html`Hello world`;
  }
}

customElements.define('x-inner', Inner);

class MyElement extends LitElement {
  static get properties() {
    return {
      nug: {},
      foo: {},
      bar: {},
      whales: {type: Number},
      fooBar: {
        converter: {
          fromAttribute: parseInt,
          toAttribute: (value: string) => value + '-attr',
        },
        reflect: true,
      },
    };
  }
  foo: string;
  nug: number[];
  whales: number;
  bar!: number;

  constructor() {
    super();
    this.foo = 'foo';
    this.nug = [1, 2, 3];
    this.whales = 0;
    this.addEventListener('click', async () => {
      this.whales++;
      await this.updateComplete;
      this.dispatchEvent(
        new CustomEvent('whales', {detail: {whales: this.whales}})
      );
      console.log(this.shadowRoot!.querySelector('.count')!.textContent);
    });
  }

  static styles = css`
    :host([hidden]) {
      display: none;
    }

    .count {
      color: green;
    }

    .content {
      border: 1px solid black;
      padding: 8px;
    }

    h4 {
      color: orange;
    }
  `;

  render() {
    const {foo, bar} = this;
    let {whales} = this;
    whales = 2 + (whales % 8);
    return html`
      <style>
        :host {
          display: block;
          background: bisque;
          padding: 8px;
          margin: 8px;
          border: 4px dotted black;
        }
      </style>
      <h4 @click="${(e: Event) => console.log(this, e.target)}">
        Foo: ${foo}, Bar: ${bar}
      </h4>
      <div class="content">
        <slot></slot>
      </div>
      <div class="count">whales: ${'🐳'.repeat(whales)}</div>
      <ul>
        ${new Array(whales).fill(0).map((_n, i) => html`<li>${i}: 🐳</li>`)}
      </ul>
      <x-inner></x-inner>
    `;
  }

  update(changedProps: PropertyValues) {
    super.update(changedProps);
    console.log('updated!', changedProps);
  }

  firstUpdated() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)._inner = this.shadowRoot!.querySelector('x-inner');
  }
}

customElements.define('my-element', MyElement);
