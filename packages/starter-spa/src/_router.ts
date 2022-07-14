import {LitElement, PropertyValues} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Router} from '@lit-labs/router';
import {routes} from './_routes.js';
import {styles} from './view-shared.styles.js';

@customElement('app-root')
export class AppRoot extends LitElement {
  @property() path = '';

  constructor() {
    super();
    const ssrPath = this.getAttribute('path') ?? this.path;
    if (ssrPath) {
      this.routes.goto(ssrPath);
    }
  }

  async scheduleUpdate() {
    await this.routes.currentEntrySuccess;
    super.scheduleUpdate();
  }

  static styles = styles;
  routes = new Router(this, routes);

  render() {
    return this.routes.outlet();
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('_request-navigation', this._onRequestNavigation);
  }

  private _onRequestNavigation = (e: CustomEvent<{path: string}>) => {
    this.routes.goto(e.detail.path);
    history.pushState(null, '', e.detail.path);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
