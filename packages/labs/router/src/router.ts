/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Routes} from './routes.js';

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
  override hostConnected() {
    super.hostConnected();
    window.addEventListener('popstate', this._onPopState);
    // Kick off routed rendering by going to the current URL
    this.goto(window.location.pathname);
  }

  override hostDisconnected() {
    super.hostDisconnected();
    window.removeEventListener('popstate', this._onPopState);
  }

  private _onPopState = (_e: PopStateEvent) => {
    this.goto(window.location.pathname);
  };
}

/**
 * Navigates all routes controller to `href`, and update the document location
 */
export function goTo(href: string): void {
  // add two entries with the same resolved url, the extra entry will get
  // overridden anyway on every new navigation
  const url = new URL(href, location.href);
  history.pushState({}, '', url);
  history.pushState({}, '', url);
  // navigate back to fire the popState with the new path
  history.back();
}

/**
 * click handle to allow the Router to take control of the anchor element
 * <a @click=${onLinkClick}>link</a>
 */
export function onLinkClick(e: Event): void {
  if (
    e.currentTarget instanceof HTMLElement &&
    e.currentTarget.hasAttribute('href')
  ) {
    e.preventDefault();
    goTo(e.currentTarget.getAttribute('href')!);
  }
}
