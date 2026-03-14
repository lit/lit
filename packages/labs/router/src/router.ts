/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Routes, type RouteConfig, type BaseRouteConfig} from './routes.js';
import type {ReactiveControllerHost} from 'lit';

// We cache the origin since it can't change
const origin = location.origin || location.protocol + '//' + location.host;

export interface RouterOptions {
  fallback?: BaseRouteConfig;
  /**
   * A prefix path that this router operates under. When set, the router will
   * only intercept navigation for URLs whose pathname starts with this prefix,
   * allowing links outside the prefix to perform full-page navigation.
   *
   * For example, if your SPA is served at `/myApp`, set `prefix: '/myApp'` so
   * that links to `/anotherApp` are not intercepted.
   */
  prefix?: string;
}

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
  private _prefix: string;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    routes: Array<RouteConfig>,
    options?: RouterOptions
  ) {
    super(host, routes, options);
    // Normalize the prefix: ensure it starts with `/` and has no trailing `/`
    const raw = options?.prefix ?? '';
    this._prefix = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  }

  /**
   * Returns a URL string of the current route, including parent routes.
   * Prepends the prefix so that generated links are full paths.
   */
  override link(pathname?: string): string {
    // Let the base class build the path from this route and any children,
    // then prepend our prefix so the link is a valid full pathname.
    const base = super.link(pathname);
    // super.link() returns an absolute path starting with '/' when the
    // pathname starts with '/'. In that case, don't prepend the prefix
    // (the caller explicitly asked for an absolute link).
    if (pathname?.startsWith('/')) {
      return base;
    }
    return this._prefix + base;
  }

  override hostConnected() {
    super.hostConnected();
    window.addEventListener('click', this._onClick);
    window.addEventListener('popstate', this._onPopState);
    // Kick off routed rendering by going to the current URL
    this.goto(this._stripPrefix(window.location.pathname) ?? '/');
  }

  override hostDisconnected() {
    super.hostDisconnected();
    window.removeEventListener('click', this._onClick);
    window.removeEventListener('popstate', this._onPopState);
  }

  /**
   * Strip the prefix from a pathname, returning the local path for routing.
   * If the pathname does not start with the prefix, returns `undefined`.
   */
  private _stripPrefix(pathname: string): string | undefined {
    if (this._prefix === '') {
      return pathname;
    }
    if (pathname === this._prefix || pathname.startsWith(this._prefix + '/')) {
      return pathname.slice(this._prefix.length) || '/';
    }
    return undefined;
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
    if (anchor.origin !== origin) {
      return;
    }

    // If a prefix is set, only intercept links under that prefix.
    const localPath = this._stripPrefix(anchor.pathname);
    if (localPath === undefined) {
      return;
    }

    e.preventDefault();
    if (href !== location.href) {
      window.history.pushState({}, '', href);
      this.goto(localPath);
    }
  };

  private _onPopState = (_e: PopStateEvent) => {
    const localPath = this._stripPrefix(window.location.pathname);
    if (localPath !== undefined) {
      this.goto(localPath);
    }
  };
}
