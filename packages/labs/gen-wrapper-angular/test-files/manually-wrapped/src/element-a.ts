import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';

/**
 * @fires thing {Event} My special event
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
      <p><code>this.foo: ${this.foo}</code></p>
      <p></code><code>this.id: ${this.id}</code></p>
      <h3>These are children</h3>
      <main><slot></slot></main>
      <button @click=${this._onClick}>Do Foo</button>
    `;
  }

  private _onClick = () => {
    this.dispatchEvent(new FooEvent(this.foo));
  };
}

export class FooEvent extends Event {
  value: number;
  constructor(value: number) {
    super('foo');
    this.value = value;
  }
}

declare global {
  interface HTMLElementEventMap {
    foo: FooEvent;
  }
}
