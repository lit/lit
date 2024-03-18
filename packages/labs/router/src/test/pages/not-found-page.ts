import {LitElement, html} from 'lit';

export class NotFoundPage extends LitElement {
  protected override render(): unknown {
    return html`<h1>404 | Not Found</h1>`;
  }
}

window.customElements.define('not-found-page', NotFoundPage);
