import {LitElement, html} from 'lit';

export class UsersPage extends LitElement {
  private _getRouter() {
    const $router = this.closest('lit-router');

    return $router;
  }

  protected override render(): unknown {
    const $router = this._getRouter();

    const userId = $router?.params('id');

    return html`<h1>Users Page ${userId}</h1>`;
  }
}

window.customElements.define('users-page', UsersPage);
