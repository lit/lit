/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ReactiveController, ReactiveControllerHost} from 'lit';

export interface StringRouteConfig {
  name?: string | undefined;
  path: string;
  render: (params: {[key: string]: string}) => unknown;
}

export interface URLPatternRouteConfig {
  name?: string | undefined;
  pattern: URLPattern;
  render: (params: {[key: string]: string}) => unknown;
}

export type RouteConfig = StringRouteConfig | URLPatternRouteConfig;

/**
 * A reactive controller that performs location-based routing using a
 * configuration of URL patterns and associated render callbacks.
 */
export class Routes implements ReactiveController {
  protected _host: ReactiveControllerHost & HTMLElement;

  /*
   * The currently installed set of routes in precedence order.
   */
  private _routes: Array<URLPatternRouteConfig & StringRouteConfig> = [];

  /*
   * The current set of child Routes controllers. These are connected via
   * the routes-connected event.
   */
  private _childRoutes: Array<Routes> = [];

  protected _parentRoutes: Routes | undefined;

  /*
   * State related to the current matching route.
   *
   * We keep this so that consuming code can access current parameters, and so
   * that we can propagate tail matches to child routes if they are added after
   * navigation / matching.
   */
  protected _currentPathname: string | undefined;
  protected _currentRoute: URLPatternRouteConfig | undefined;
  protected _currentParams: {
    [key: string]: string;
  } = {};

  /**
   * Callback to call when this controller is disconnected.
   *
   * It's critical to call this immediately in hostDisconnected so that this
   * controller instance doesn't receive a tail match meant for another route.
   */
  private _onDisconnect: (() => void) | undefined;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    routes: Array<RouteConfig>
  ) {
    (this._host = host).addController(this);
    for (const route of routes) {
      this._routes.push({
        name: route.name,
        render: route.render,
        path: (route as StringRouteConfig).path,
        pattern:
          (route as URLPatternRouteConfig).pattern ??
          new URLPattern({pathname: (route as StringRouteConfig).path}),
      });
    }
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

  goto(pathname: string) {
    // TODO (justinfagnani): generalize this to handle query params and
    // fragments. It currently only handles path names because it's easier to
    // completely disregard the origin for now. The click handler only does
    // an in-page navigation if the origin matches anyway.
    let tailGroup: string | undefined;
    if (this._routes.length === 0) {
      // If a routes controller has none of its own routes it acts like it has
      // one route of `/*` so that it passes the whole pathname as a tail
      // match.
      tailGroup = pathname;
      this._currentPathname = '';
      // Simulate a tail group with the whole pathname
      this._currentParams = {0: tailGroup};
    } else {
      const route = (this._currentRoute = this._getRoute(pathname));
      const r = route?.pattern.exec({pathname});
      this._currentParams = r?.pathname.groups ?? {};
      tailGroup = getTailGroup(this._currentParams);
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
  get outlet() {
    return this._currentRoute?.render(this._currentParams);
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
  private _getRoute(pathname: string) {
    return this._routes.find((r) => r.pattern.test({pathname: pathname}));
  }

  hostConnected() {
    this._host.addEventListener(
      RoutesConnectedEvent.eventName,
      this._onRoutesConnected
    );
    // TODO: connect to parent router
    const event = new RoutesConnectedEvent(this);
    this._host.dispatchEvent(event);
    this._onDisconnect = event.onDisconnect;
  }

  hostDisconnected() {
    // When this child routes constroller is disconnected because a parent
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
const getTailGroup = (groups: {[key: string]: string}) => {
  let tailKey: string | undefined;
  for (const key of Object.keys(groups)) {
    if ((/\d+/.test(key) && tailKey === undefined) || key > tailKey!) {
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
  static readonly eventName = 'routes-connected';
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
    'routes-connected': RoutesConnectedEvent;
  }
}
