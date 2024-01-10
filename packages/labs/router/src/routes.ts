/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/// <reference types="urlpattern-polyfill" />

import type {ReactiveController, ReactiveControllerHost} from 'lit';

export interface BaseRouteConfig {
  name?: string | undefined;
  render?: (params: {[key: string]: string | undefined}) => unknown;
  enter?: (params: {
    [key: string]: string | undefined;
  }) => Promise<boolean> | boolean;
}

/**
 * A RouteConfig that matches against a `path` string. `path` must be a
 * [`URLPattern` compatible pathname pattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern/pathname).
 */
export interface PathRouteConfig extends BaseRouteConfig {
  path: string;
}

/**
 * A RouteConfig that matches against a given [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)
 *
 * While `URLPattern` can match against protocols, hostnames, and ports,
 * routes will only be checked for matches if they're part of the current
 * origin. This means that the pattern is limited to checking `pathname` and
 * `search`.
 */
export interface URLPatternRouteConfig extends BaseRouteConfig {
  pattern: URLPattern;
}

/**
 * A description of a route, which path or pattern to match against, and a
 * render() callback used to render a match to the outlet.
 */
export type RouteConfig = PathRouteConfig | URLPatternRouteConfig;

// A cache of URLPatterns created for PathRouteConfig.
// Rather than converting all given RoutConfigs to URLPatternRouteConfig, this
// lets us make `routes` mutable so users can add new PathRouteConfigs
// dynamically.
const patternCache = new WeakMap<PathRouteConfig, URLPattern>();

const isPatternConfig = (route: RouteConfig): route is URLPatternRouteConfig =>
  (route as URLPatternRouteConfig).pattern !== undefined;

const getPattern = (route: RouteConfig) => {
  if (isPatternConfig(route)) {
    return route.pattern;
  }
  let pattern = patternCache.get(route);
  if (pattern === undefined) {
    patternCache.set(route, (pattern = new URLPattern({pathname: route.path})));
  }
  return pattern;
};

/**
 * A reactive controller that performs location-based routing using a
 * configuration of URL patterns and associated render callbacks.
 */
export class Routes implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;

  /*
   * The currently installed set of routes in precedence order.
   *
   * This array is mutable. To dynamically add a new route you can write:
   *
   * ```ts
   * this._routes.routes.push({
   *   path: '/foo',
   *   render: () => html`<p>Foo</p>`,
   * });
   * ```
   *
   * Mutating this property does not trigger any route transitions. If the
   * changes may result is a different route matching for the current path, you
   * must instigate a route update with `goto()`.
   */
  routes: Array<RouteConfig> = [];

  /**
   * A default fallback route which will always be matched if none of the
   * {@link routes} match. Implicitly matches to the path "/*".
   */
  fallback?: BaseRouteConfig;

  /*
   * The current set of child Routes controllers. These are connected via
   * the routes-connected event.
   */
  private readonly _childRoutes: Array<Routes> = [];

  private _parentRoutes: Routes | undefined;

  /*
   * State related to the current matching route.
   *
   * We keep this so that consuming code can access current parameters, and so
   * that we can propagate tail matches to child routes if they are added after
   * navigation / matching.
   */
  private _currentPathname: string | undefined;
  private _currentRoute: RouteConfig | undefined;
  private _currentParams: {
    [key: string]: string | undefined;
  } = {};

  /**
   * Callback to call when this controller is disconnected.
   *
   * It's critical to call this immediately in hostDisconnected so that this
   * controller instance doesn't receive a tail match meant for another route.
   */
  // TODO (justinfagnani): Do we need this now that we have a direct reference
  // to the parent? We can call `this._parentRoutes.disconnect(this)`.
  private _onDisconnect: (() => void) | undefined;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    routes: Array<RouteConfig>,
    options?: {fallback?: BaseRouteConfig}
  ) {
    (this._host = host).addController(this);
    this.routes = [...routes];
    this.fallback = options?.fallback;
  }

  /**
   * Returns a URL string of the current route, including parent routes,
   * optionally replacing the local path with `pathname`.
   */
  link(pathname?: string): string {
    if (pathname?.startsWith('/')) {
      return pathname;
    }
    if (pathname?.startsWith('.')) {
      throw new Error('Not implemented');
    }
    pathname ??= this._currentPathname;
    return (this._parentRoutes?.link() ?? '') + pathname;
  }

  /**
   * Navigates this routes controller to `pathname`.
   *
   * This does not navigate parent routes, so it isn't (yet) a general page
   * navigation API. It does navigate child routes if pathname matches a
   * pattern with a tail wildcard pattern (`/*`).
   */
  async goto(pathname: string) {
    // TODO (justinfagnani): handle absolute vs relative paths separately.
    // TODO (justinfagnani): do we need to detect when goto() is called while
    // a previous goto() call is still pending?

    // TODO (justinfagnani): generalize this to handle query params and
    // fragments. It currently only handles path names because it's easier to
    // completely disregard the origin for now. The click handler only does
    // an in-page navigation if the origin matches anyway.
    let tailGroup: string | undefined;

    if (this.routes.length === 0 && this.fallback === undefined) {
      // If a routes controller has none of its own routes it acts like it has
      // one route of `/*` so that it passes the whole pathname as a tail
      // match.
      tailGroup = pathname;
      this._currentPathname = '';
      // Simulate a tail group with the whole pathname
      this._currentParams = {0: tailGroup};
    } else {
      const route = this._getRoute(pathname);
      if (route === undefined) {
        throw new Error(`No route found for ${pathname}`);
      }
      const pattern = getPattern(route);
      const result = pattern.exec({pathname});
      const params = result?.pathname.groups ?? {};
      tailGroup = getTailGroup(params);
      if (typeof route.enter === 'function') {
        const success = await route.enter(params);
        // If enter() returns false, cancel this navigation
        if (success === false) {
          return;
        }
      }
      // Only update route state if the enter handler completes successfully
      this._currentRoute = route;
      this._currentParams = params;
      this._currentPathname =
        tailGroup === undefined
          ? pathname
          : pathname.substring(0, pathname.length - tailGroup.length);
    }

    // Propagate the tail match to children
    if (tailGroup !== undefined) {
      for (const childRoutes of this._childRoutes) {
        childRoutes.goto(tailGroup);
      }
    }
    this._host.requestUpdate();
  }

  /**
   * The result of calling the current route's render() callback.
   */
  outlet() {
    return this._currentRoute?.render?.(this._currentParams);
  }

  /**
   * The current parsed route parameters.
   */
  get params() {
    return this._currentParams;
  }

  /**
   * Matches `url` against the installed routes and returns the first match.
   */
  private _getRoute(pathname: string): RouteConfig | undefined {
    const matchedRoute = this.routes.find((r) =>
      getPattern(r).test({pathname: pathname})
    );
    if (matchedRoute || this.fallback === undefined) {
      return matchedRoute;
    }
    if (this.fallback) {
      // The fallback route behaves like it has a "/*" path. This is hidden from
      // the public API but is added here to return a valid RouteConfig.
      return {...this.fallback, path: '/*'};
    }
    return undefined;
  }

  hostConnected() {
    this._host.addEventListener(
      RoutesConnectedEvent.eventName,
      this._onRoutesConnected
    );
    const event = new RoutesConnectedEvent(this);
    this._host.dispatchEvent(event);
    this._onDisconnect = event.onDisconnect;
  }

  hostDisconnected() {
    // When this child routes controller is disconnected because a parent
    // outlet rendered a different template, disconnecting will ensure that
    // this controller doesn't receive a tail match meant for another route.
    this._onDisconnect?.();
    this._parentRoutes = undefined;
  }

  private _onRoutesConnected = (e: RoutesConnectedEvent) => {
    // Don't handle the event fired by this routes controller, which we get
    // because we do this.dispatchEvent(...)
    if (e.routes === this) {
      return;
    }

    const childRoutes = e.routes;
    this._childRoutes.push(childRoutes);
    childRoutes._parentRoutes = this;

    e.stopImmediatePropagation();
    e.onDisconnect = () => {
      // Remove route from this._childRoutes:
      // `>>> 0` converts -1 to 2**32-1
      this._childRoutes?.splice(
        this._childRoutes.indexOf(childRoutes) >>> 0,
        1
      );
    };

    const tailGroup = getTailGroup(this._currentParams);
    if (tailGroup !== undefined) {
      childRoutes.goto(tailGroup);
    }
  };
}

/**
 * Returns the tail of a pathname groups object. This is the match from a
 * wildcard at the end of a pathname pattern, like `/foo/*`
 */
const getTailGroup = (groups: {[key: string]: string | undefined}) => {
  let tailKey: string | undefined;
  for (const key of Object.keys(groups)) {
    if (/\d+/.test(key) && (tailKey === undefined || key > tailKey!)) {
      tailKey = key;
    }
  }
  return tailKey && groups[tailKey];
};

/**
 * This event is fired from Routes controllers when their host is connected to
 * announce the child route and potentially connect to a parent routes controller.
 */
export class RoutesConnectedEvent extends Event {
  static readonly eventName = 'lit-routes-connected';
  readonly routes: Routes;
  onDisconnect?: () => void;

  constructor(routes: Routes) {
    super(RoutesConnectedEvent.eventName, {
      bubbles: true,
      composed: true,
      cancelable: false,
    });
    this.routes = routes;
  }
}

declare global {
  interface HTMLElementEventMap {
    [RoutesConnectedEvent.eventName]: RoutesConnectedEvent;
  }
}
