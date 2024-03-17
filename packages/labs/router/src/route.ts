/// <reference types="urlpattern-polyfill" />

import {
  HTMLElementConstructor,
  CustomRouterGuard,
  Component,
  Guard,
} from './declarations.js';

export type RouteConfig = Pick<
  Route,
  'path' | 'component' | 'children' | 'beforeEnter'
>;

export class Route {
  /**
   * The path of route.
   */
  readonly path!: string;

  /**
   * The component of route.
   *
   * @example
   * ```ts
   * // String
   * { path: '/foo', component: 'foo-component' }
   *
   * // HTMLElement
   * import { FooComponent } from './foo-component.js'
   *
   * { path: '/foo', component: FooComponent }
   *
   * // Lazy loading
   * {
   *   path: '/foo',
   *   component: () => import('./foo-component.js').then((m) => m.FooComponent)
   * }
   * ```
   */
  readonly component!: Component;

  /**
   * The children of route.
   *
   * @example
   * ```ts
   * const routeConfig: RouteConfig = {
   *   path: '/foo',
   *   component: 'foo-component',
   *   children: [
   *     {
   *       path: '/bar',
   *       component: 'bar-component'
   *     }
   *   ]
   * }
   * ```
   */
  children: Partial<RouteConfig>[] = [];

  /**
   * Callback executed before the route is entered.
   *
   * @example
   * ```ts
   * const routeConfig: RouteConfig = {
   *   path: '/foo',
   *   component: 'foo-component',
   *   beforeEnter: [
   *     () => {
   *       // Do something...
   *       return true
   *     }
   *   ]
   * }
   * ```
   */
  beforeEnter: Guard[] = [];

  private _parent: Route | null = null;

  readonly urlPattern!: URLPattern;

  constructor(path: string, component: Component) {
    this.path = path;
    this.component = component;

    this.urlPattern = new URLPattern(this.path, window.location.origin);
  }

  setParent(parent: Route): void {
    this._parent = parent;
  }

  match(path: string): boolean {
    return this.urlPattern.test(window.location.origin + path);
  }

  /**
   * Resolves the provided component and returns an HTMLElement instance.
   *
   * This method is used to take a representation of a component
   * (such as a function that returns a TemplateResult or a promise
   * that resolves to a custom module) and create an HTMLElement
   * instance that can be used in the DOM.
   *
   * @param component The component to resolve.
   */
  private async _resolveComponent(component: Component): Promise<unknown> {
    // Resolve the tag name of the component.
    if (typeof component === 'string') {
      return document.createElement(component);
    }

    // Resolve a custom element.
    if (
      typeof component === 'function' &&
      component.prototype instanceof HTMLElement
    ) {
      return new (component as HTMLElementConstructor)();
    }

    // Resolve a lazy-loaded module.
    const Module = await (component as () => Promise<HTMLElementConstructor>)();

    return new Module();
  }

  async resolveRecursiveGuard(router: CustomRouterGuard): Promise<boolean> {
    if (!this.beforeEnter.length) {
      return Promise.resolve(true);
    }

    const guards = this.beforeEnter.map((guard) => guard(router));
    const results = await Promise.all(guards);

    const parentGuardResult = this._parent
      ? await this._parent.resolveRecursiveGuard(router)
      : true;

    return results.every((result) => result) && parentGuardResult;
  }

  /**
   * Resolves a component and, optionally, nests it in a parent
   * component using the [Chain of Responsibility](https://refactoring.guru/design-patterns/chain-of-responsibility) pattern.
   *
   * @param component The component to resolve.
   * @returns A promise that resolves to an HTMLElement instance.
   */
  async resolve(component?: () => HTMLElement): Promise<unknown> {
    let _component: HTMLElement | null = component ? component() : null;

    if (!_component) {
      _component = (await this._resolveComponent(
        this.component
      )) as unknown as HTMLElement;
    }

    if (this._parent) {
      const parent = (await this._resolveComponent(
        this._parent.component
      )) as HTMLElement;

      const child = _component;

      parent.appendChild(child as HTMLElement);

      return this._parent.resolve(() => parent);
    }

    return _component;
  }
}
