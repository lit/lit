import {LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {Router} from '@lit-labs/router';
import {routes} from './_routes.js';
import {colors, shape, states, typography} from './utils/theme.styles.js';

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = [colors, typography, shape, states];
  private _routes = new Router(this, routes);

  render() {
    return this._routes.outlet();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
