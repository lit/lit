
import {html, render} from '../lit-html.js';
import {file} from '../lib/file.js';

export class LitRenderFile extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    render(html`${file('render-file.tpl', 'Loading...')}`, this.shadowRoot || this);
  }
}

customElements.define('lit-render-file', LitRenderFile);