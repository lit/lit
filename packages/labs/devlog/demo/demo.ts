import {html, render, LitElement, css} from 'lit';
import {} from '@lit-labs/motion';
import {customElement, property} from 'lit/decorators.js';
import '../src/terminal.js';

@customElement('lit-explain-main')
export class Slides extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding-left: 20px;
      padding-top: 20px;
    }
    [inline] {
      display: inline;
      /* outline: 2px solid green; */
    }
  `;

  @property({attribute: false}) count = 0;

  @property() name = 'Bob';

  override render() {
    const preContent = `      
        <div>count: \${this.count}</div>
        <button @click=\${this.onClick}>+</button>
        <lit-example-child .count=\${this.count * 2}></lit-example-child>
        <div>name: \${this.name}</div>
        <input
            value=\${this.name} 
            @input=\${this.onInput}>
    `;
    return html`
      <div>count: ${this.count}</div>
      <button @click=${this.onClick}>+</button>
      <div><lit-example-child count=${this.count * 2}></lit-example-child></div>
      <div>name: ${this.name}</div>
      <input value=${this.name} @input=${this.onInput} />

      <pre>${preContent}</pre>

      <div>
        prefix prefix prefix
        <pre inline>${'hello\ncontent on newline'}</pre>
        postfix postfix postfix
      </div>
    `;
  }

  onClick() {
    this.count++;
  }

  onInput(e: InputEvent) {
    this.name = (e.target as HTMLInputElement).value;
  }
}

@customElement('lit-example-child')
export class ChildElem extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
  `;

  @property({type: Number}) count = 0;

  override render() {
    return html` count * 2 inside child: ${this.count} `;
  }
}

function styles() {
  return html`
    <style>
      body {
        font-size: 110%;
      }
    </style>
  `;
}

render(html`${styles()}<lit-explain-main></lit-explain-main>`, document.body);

declare global {
  interface ImportMeta {
    hot?: {accept(): void};
  }
}

import.meta.hot?.accept();
