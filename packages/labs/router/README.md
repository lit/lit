# @lit-labs/router

A router for Lit.

## Status

🚧 `@lit-labs/router` is part of the Lit Labs set of packages - it is published in order to get feedback on the design and not ready for production. Breaking changes are likely to happen frequently. 🚧

This package requires either a native [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) implementation (which is currently only implemented in Chrome, Edge, and other Chromium browsers) or a URLPattern polyfill, like [`urlpattern-polyfill`](https://github.com/kenchris/urlpattern-polyfill).

## Overview

`@lit-labs/router` is a component-oriented router API vended as reactive controllers. Routes are configured as part of component definitions, and integrated into the component lifecycle and rendering.

Usage will generally look like this, with a configuration in a reactive controller, and rendering done via route-specific render callbacks and an "outlet" to use in the main render() method:

```ts
class MyElement extends LitElement {
  private _routes = new Routes(this, [
    {path: '/', render: () => html`<h1>Home</h1>`},
    {path: '/projects', render: () => html`<h1>Projects</h1>`},
    {path: '/about', render: () => html`<h1>About</h1>`},
  ]);

  render() {
    return html`
      <header>...</header>
      <main>${this._routes.outlet()}</main>
      <footer>...</footer>
    `;
  }
}
```

Routes can be nested: a route path can include a trailing `/*` pattern to match against a prefix, and will automatically propagate that prefix to Routes controllers defined in child elements.

The general shape of the API includes:

- A `Router` controller that's used as a top-level singleton to set up event listeners
- A `Routes` controller for declaring routes inside components
- Declaration of routes with [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) and render callbacks
- Extraction of URL pattern parameters into data objects passed to render callbacks
- A `routes.outlet()` method that renders the current route's render callback
- A `routes.link()` method to generate URLs to use in `<a>` tags, etc.
- A `routes.goto()` method for performing a navigation

## API

### Router

A Router is a controller (a subclass of the Routes controller) for use at the top-level of an application. It's main purpose is to set up global `click` and `popstate` event listeners (which should be installed only once on a page). It can optionally contain route definitions as a convenience.

It can be installed with no configuration:

```ts
class App extends LitElement {
  private router = new Router(this);
}
```

Or contain route configurations:

```ts
class MyElement extends LitElement {
  private router = new Router(this, [
    {path: '/', render: () => html`<h1>Home</h1>`},
  ]);

  render() {
    return this.router.outlet();
  }
}
```

### Routes

Routes is the main interface into the router API. A Routes controller contains route definitions and the templates that each route renders:

```ts
class MyElement extends LitElement {
  private routes = new Routes(this, [
    {path: '/', render: () => html`<h1>Home</h1>`},
    {path: '/projects', render: () => html`<h1>Projects</h1>`},
    {path: '/about', render: () => html`<h1>About</h1>`},
  ]);
}
```

The second argument is the route configuration: an array of `RouteConfig` objects.

#### RouteConfig

A RouteConfig contains at the minimum the pattern to match URLs against and a template to render. Names can be provided to reference routes for link generation.

There are two types of `RouteConfig`s: `PathRouteConfig` and `URLPatternRouteConfig`:

`PathRouteConfig` lets you specify the URL pattern as a path string:

```ts
{name: 'home', path: '/', render: () => html`<h1>Home</h1>`}
```

```ts
export interface PathRouteConfig {
  name?: string | undefined;
  path: string;
  render: (params: {[key: string]: string}) => unknown;
}
```

`URLPatternRouteConfig` lets you specify the URL pattern as a [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) object:

```ts
{pattern: new URLPattern({pathname: '/'}), render: () => html`<h1>Home</h1>`}
```

```ts
export interface URLPatternRouteConfig {
  name?: string | undefined;
  pattern: URLPattern;
  render: (params: {[key: string]: string}) => unknown;
}
```

#### Render callbacks

The render callback is called when the outlet method of the Routes object is called. It is passed an object with the parameters extracted from the matching URL.

Example with named parameter:

```ts
{
  path: '/profile/:id',
  render: ({id}) => html`<x-profile .profileId=${id}></x-profile>`
}
```

#### Outlets

An outlet is where a routes object renders the currently selected route's template. It can be used anywhere in the host element's template:

```ts
html`<main>${this.routes.outlet()}</main>`;
```

#### enter() callbacks

A route can define an `enter()` callback that lets it do work before rendering and optionally reject that route as a match.

`enter()` can be used to load and wait for necessary component definitions:

```ts
{
  path: '/*',
  render: (params) => html`<x-foo></x-foo>`,
  enter: async (params) => {
    await import('./x-foo.js');
  },
}
```

or dynamically install new routes:

```ts
{
  path: '/*',
  render: (params) => html`<h1>Not found: params[0]</h1>`,
  enter: async (params) => {
    const path = params[0];
    const dynamicRoute = getDynamicRoute(path);
    if (dynamicRoute) {
      const {routes} = this._router;
      routes.splice(routes.length - 1, 0, dynamicRoute);
      // Trigger the router again
      await this._router.goto('/' + path);
      // Reject this route so the dynamic one is matched
      return false;
    }
  }
}
```

#### `goto()`

`goto(url: string)` is a programmatic navigation API. It takes full URLs for top-level navigation and relative URLs for navigation within a nested route space.

`goto(name: string, params: object)` _(not implemented)_ allows navigation via named routes. The name and params are scoped to the Routes object it's called on, though nested routes can be triggered by a "tail" parameter - the match of a trailing `/*` parameter (See tail groups).

`goto()` returns a Promise that resolves when any triggered async `enter()` callbacks have completed.

#### `link()`

Components need to generate links to resources within the app. It's desirable to not require that link generation has global knowledge of URLs, so links should be able to be generated with either only local information, or with abstracted parameters. `routes.link()` helps generate different kinds of links:

##### Relative links

Relative links are relative to the parent route and its current state, and can be specified with a path string or name and parameters.

Examples

- `this._routes.link(user.id)` - within a `<x-user>` component that has a route pattern like `':id'`, this would link to another user profile.
- `this._routes.link('profile', {id: user.id})` - the same URL generated with a named route

These links work regardless of where the component is mounted in the URL space.

##### Global links

_Not implemented_

Global or absolute links don't need a `link(url: string)` form - an absolute URL can already be used in the `href` attribute of an `<a>` tag. But links within components shouldn't need to be tied to the specific URL layout - you should be able to describe the route by name and parameters. These names and parameters need to be nested to work with nested routes. _TBD_

### Nested Routes

Nested routes allow child components to define a subset of the route space mounted at a URL prefix path chosen by a parent.

```ts
class XParent extends LitElement {
  private _routes = new Routes(this, [
    {path: 'foo', render: () => html`<x-foo></x-foo>`},
    // Here we mount a child component that defines its own sub-routes.
    // We need the trailing /* parameter to match on the prefix and pass
    // a path to the child to parse.
    {path: '/child/*', render: () => html`<x-child></x-child>`},
  ]);
  render() {
    return html`${this._routes.outlet()}`;
  }
}

class XChild extends LitElement {
  private _routes = new Routes(this, [
    {path: 'foo', render: () => html`<x-foo></x-foo>`},
    {path: 'bar', render: () => html`<x-bar></x-bar>`},
  ]);
  render() {
    return html`${this._routes.outlet()}`;
  }
}
```

In this example, the page can handle URLs `/foo`, `/child/foo` and `/child/bar`.

### `routes` Array

`Routes` (and `Router`) have a property named `routes` that is an array of the route configurations. This array is mutable, so code an dynamically add and remove routes. Routes match in order of the array, so the array defines the route precedence.

## TODO

### Server router integration

This client-side router is intended to be able to integrate with server-side routing, both configuration-based routers and convention-based routers like file-based routers.

Current ideas for integration include a fallback route handler (installed by the app) that delegates to a server API call that returns additional route configuration dynamically. The minimal API needed in the client router are:

1. The ability to dynamically add routes
2. Fallback route handlers.
