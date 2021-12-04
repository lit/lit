# @lit-labs/router

A router for Lit.

## Overview

`@lit-labs/router` is a component-oriented router API vended as reactive controllers. Routes are configured as part of component definitions, and integrated into the component lifecycle and rendering.

Usage will generally look like this, with a configuration in a reactive controller, and rendering done via route-specific render callbacks and an "outlet" to use in the main render() method:

```ts
class MyElement extends LitElement {
  private _routes = new Routes(this, [
    {path: '/', render: () => html`<h1>Home</h1>`},
    {path: '/projects', render: () => html`<h1>Projects</h1>`},
    {path: '/about', render: () => html`<h1>About</h3>`},
  ]);

  render() {
    return html`
      <header>...</header>
      <main>${this._routes.outlet}</main>
      <footer>...</footer>
    `;
  }
}
```

Routes can be nested: a route path can include a trailing `/*` pattern to match against a prefix, and will automatically propagate that prefix to Routes controllers defined in child elements.

The general shape of the API includes:

- A `Router` controller that's used as a top-level singleton to set up event listeners
- A `Routes` controller for declaring routes inside components
- Declaration of routes with `URLPatterns` and render callbacks
- Extraction of URL pattern parameters into data objects passed to render callbacks
- A `routes.outlet` that renders the current route's render callback
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
    return router.outlet;
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
    {path: '/about', render: () => html`<h1>About</h3>`},
  ]);
}
```

The second argument is the route configuration: an array of `RouteConfig` objects.

#### RouteConfig

A RouteConfig contains at the minimum the pattern to match URLs against and a template to render. Names can be provided to reference routes for link generation.

There are two types of RoutConfig: `PathRouteConfig` and `URLPatternRouteConfig`:

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

The render callback is called when the outlet property of the Routes object is accessed. It is passed an object with the parameters extracted from the matching URL.

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
html`${this.routes.outlet}`;
```

#### `goto()`

`goto(url: string)` is a programmatic navigation API. It should be able to take full URLs for top-level navigation and relative URLs for navigation within a nested route space.

`goto(name: string, params: object)` _(not implemented)_ allows navigation via named routes. The name and params are scoped to the Routes object it's called on, though nested routes can be triggered by a "tail" parameter - the match of a trailing /\*parameter (See tail groups).

#### `link()`

Components need to generate links to resources within the app. It's desirable to not require that link generation has global knowledge of URLs, so links should be able to be generated with either only local information, or with abstracted parameters. `routes.link()` helps generate different kinds of links:

##### Relative links

Relative links are relative to the parent route and its current state, and can be specified with a path string or name and parameters.

Examples

- `this._routes.link(user.id)` - within a `<x-user>` component that has a route pattern like ':id', this would link to another user profile.
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
    return html`${this._routes.outlet}`;
  }
}

class XChild extends LitElement {
  private _routes = new Routes(this, [
    {path: 'foo', render: () => html`<x-foo></x-foo>`},
    {path: 'bar', render: () => html`<x-bar></x-bar>`},
  ]);
  render() {
    return html`${this._routes.outlet}`;
  }
}
```

In this example, the page can handle URLs `/foo`, `/child/foo` and `/child/bar`.
