import { LitElement, html, customElement, property, css } from 'lit-element';

@customElement('my-element')
class MyElement extends LitElement {

  static styles = css`
    :host {
      display: block;
      border: solid 1px gray;
      padding: 16px;
      max-width: 800px;
    }
  `;

  @property()
  name = 'World';

  @property({type: Number})
  count = 0;

  render(){
    return html`
      <h1>Hello, ${this.name}!</h1>
      <button @click=${this._onClick}>Click Count: ${this.count}</button>
      <div class="slot"><slot></slot></div>
    `;
  }

  private _onClick() {
    this.count++;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
