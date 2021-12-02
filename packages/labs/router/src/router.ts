/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveControllerHost} from 'lit';
import {Routes, RouteConfig} from './routes.js';

/**
 * A root-level router that installs global event listeners to intercept
 * navigation.
 *
 * This class extends Routes so that it can also have a route configuration.
 *
 * There should only be one Router instance on a page, since the Router
 * installs global event listeners on `window` and `document`. Nested
 * routes should be configured with the `Routes` class.
 */
export class Router extends Routes {
  constructor(
    host: ReactiveControllerHost & HTMLElement,
    routes?: Array<RouteConfig>
  ) {
    super(host, routes ?? []);
    // Kick off routed rendering by going to the current URL
    // TODO: should this be done in the first update instead?
    this.goto(window.location.pathname);
  }

  override hostConnected() {
    super.hostConnected();
    window.addEventListener('click', this._onClick);
    window.addEventListener('popstate', this._onPopState);
  }

  override hostDisconnected() {
    super.hostDisconnected();
    window.removeEventListener('click', this._onClick);
    window.removeEventListener('popstate', this._onPopState);
  }

  private _onClick = (e: MouseEvent) => {
    const isNonNavigationClick =
      e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey;
    if (e.defaultPrevented || isNonNavigationClick) {
      return;
    }

    const anchor = e
      .composedPath()
      .find((n) => (n as HTMLElement).tagName === 'A') as
      | HTMLAnchorElement
      | undefined;
    if (
      anchor === undefined ||
      anchor.target !== '' ||
      anchor.hasAttribute('download') ||
      anchor.getAttribute('rel') === 'external'
    ) {
      return;
    }

    const href = anchor.href;
    if (href === '' || href.startsWith('mailto:')) {
      return;
    }

    const location = window.location;
    const origin = location.origin || location.protocol + '//' + location.host;
    if (anchor.origin === origin) {
      return;
    }

    e.preventDefault();
    if (href !== location.href) {
      window.history.pushState({}, '', href);
      this.goto(anchor.pathname);
    }
  };

  private _onPopState = (_e: PopStateEvent) => {
    this.goto(window.location.pathname);
  };
}
