import {LitElement, html} from 'lit';

export class DashboardPage extends LitElement {
  protected override render(): unknown {
    return html`
      <h1>Dashboard Page</h1>
      <slot></slot>
    `;
  }
}

window.customElements.define('dashboard-page', DashboardPage);
