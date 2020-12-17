// TODO(sorvell): rollup problem: it's trying to import all of this from
// @lit/reactive-element, but importing separately works.
// import { LitElement, html, css, PropertyValues } from '../lit-element.js';
import {LitElement} from '../lit-element.js';
import {html} from 'lit-html';
import {css, PropertyValues} from '@lit/reactive-element';
import {property} from '../decorators/property.js';

class AnotherElement extends LitElement {
  static styles = css`
    :host {
      color: #03dac6;
    }
  `;

  render() {
    return html`${this.localName} says hi`;
  }
}

customElements.define('another-element', AnotherElement);

class MyElement extends LitElement {
  @property()
  foo = 'foo';
  @property()
  nug = [1, 2, 3];
  @property({type: Number})
  whales = 0;
  @property()
  bar!: number;
  @property({
    converter: {
      fromAttribute: parseInt,
      toAttribute: (value: string) => value + '-attr',
    },
    reflect: true,
  })
  fooBar?: string;

  constructor() {
    super();
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
    :host {
      display: block;
      font-family: sans-serif;
      background: #000051;
      color: white;
      padding: 16px;
      margin: 8px;
      border: 4px solid #03dac6;
      border-radius: 4px;
    }

    .count {
      color: #03dac6;
    }

    .content {
      border: 1px solid #03dac6;
      border-radius: 4px;
      padding: 8px;
    }

    header {
      font-size: 2rem;
    }

    section {
      margin: 16px;
      font-size: 1.2rem;
    }
  `;

  render() {
    this.whales = Math.max(1, this.whales % 8);
    return html`
      <header>${this.localName}</header>
      <section @click="${(e: Event) => console.log(this, e.target)}">
        Properties: foo: ${this.foo}, bar: ${this.bar}
      </section>
      <section class="content">
        <slot></slot>
      </section>
      <section>
        Composed element:
        <another-element></another-element>
      </section>
      <section class="count">Whales: ${'🐳'.repeat(this.whales)}</section>
    `;
  }

  updated(changedProps: PropertyValues) {
    console.log('updated!', changedProps);
  }

  firstUpdated(changedProps: PropertyValues) {
    console.log('firstUpdated!', changedProps);
  }
}

customElements.define('my-element', MyElement);
