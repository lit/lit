import {html, LitElement} from 'lit';

export class AboutPage extends LitElement {
  protected override render(): unknown {
    return html`<h1>About Page</h1>`;
  }
}

window.customElements.define('about-page', AboutPage);
