# @lit-labs/router

A router for Lit.

## Status

> [!WARNING]
> 🚧 `@lit-labs/router` is part of the Lit Labs set of packages - it is published in order to get feedback on the design and not ready for production. Breaking changes are likely to happen frequently. 🚧

> [!TIP] > [**Lit Router**](#lit-router) is a new Router API for Lit that is designed to be more intuitive and powerful than the current API.

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

## Lit Router

**Lit Router** is a new **Router API** for Lit that is designed to be more intuitive and powerful than the current API. This new API contains a number of features that are not present in the current API, such as:

- 🛣️ Basic routing.
- 🚀 Programmatic navigation.
- 🌳 Nested routing
- ⏳ Lazy loading.
- 🔄🔍 Route params & query.
- 🚧 Route guards.

### Usage

Creating a single-page application with Lit + Lit Router is a piece of cake! 🍰 With Lit, we're building our application using components, and when we add Lit Router to the mix, all we have to do is assign our components to the routes and let Lit Router work its magic to render them in the right place. ✨ Here's a simple example for you:

**HTML**

Import the `<lit-router>` component in your `index.html` file.

```html
<lit-router></lit-router>
```

**JavaScript/Typescript**

Now, let's create a simple example of how to use **Lit Router** in your application.

```ts
// Import package.
import '@lit-labs/router';

// Import your static pages.
import {HomePage} from './pages/home-page.js';
import './pages/about-page.js';

// Get a router.
const $router = document.querySelector('lit-router');

// Register your routes.
$router.setRoutes([
  {path: '/', component: HomePage},
  {path: '/about', component: 'about-page'},
  {
    path: '/terms',
    component: () =>
      import('./pages/terms-page.js').then((module) => module.TermsPage),
  },
]);
```

### Dynamic Routes

Lit Router also provides a simple API to define dynamic routes. We can define dynamic routes of many types. Below are some examples:

```ts
import {UserPage} from './pages/user-page.js';

const routes: Route[] = [{path: '/users/:id', component: UserPage}];
```

> [!NOTE]
> To capture route parameters, you can see it in the section [Route Params & Query](#route-params--query).

> [!WARNING]
> This package requires either a native [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) implementation (which is currently only implemented in Chrome, Edge, and other Chromium browsers) or a URLPattern polyfill, like [`urlpattern-polyfill`](https://github.com/kenchris/urlpattern-polyfill).

### Lazy Loading

Lazy loading is a technique for loading pages on demand. This means that we only load the page when the user navigates to it. This is very useful when we have a large application and we want to improve the performance of our application. Here's an example:

```ts
const routes: Route[] = [
  {
    path: '/',
    component: () => import('./pages/home-page.js').then((m) => m.HomePage),
  },
];
```

### Nested Routes

Many times we need to define nested because we have a page that has a sidebar and we want to render the content of the sidebar in a specific place. For this we can use the children property. Here's an example:

```ts
const routes: Route[] = [
  {
    path: '/',
    component: DashboardPage,
    children: [{path: '/settings', component: SettingsPage}],
  },
];
```

### Displayed 404 Page

When a user navigates to a page that does not exist, we can display a 404 page. This is very useful because it helps the user understand that the page they are looking for does not exist. Here's an example:

```ts
const routes: Route[] = [
  {path: '/', component: HomePage},
  {path: '/about', component: AboutPage},
  {path: '*', component: NotFoundPage},
];
```

### Programmatic Navigation

Lit Router also provides a simple API for programmatic navigation. You can use the navigate method to `navigate()` to a specific route. Here's an example:

```ts
// First option.
import {navigate} from '@lit-labs/router';

navigate({path: '/about'});

// Second option.
const $router = document.querySelector('lit-router');

$router.navigate({path: '/about'});
```

### Navigate for History

You can also use the `forward()` & `back()` method to navigate for history. Here's an example:

```ts
// First option.
import {forward, back} from '@lit-labs/router';

forward();
back();

// Second option.
const $router = document.querySelector('lit-router');

$router.forward();
$router.back();

// Third option.
window.history.forward();
window.history.back();
```

### Route Params & Query

Lit Router also provides a simple API to get route params and query. You can use the `params()` and `query()` property to get route params and query. Here's an example:

```ts
// Get all queries.
// Example: /users?name=Ivan&age=23
$router.qs(); // { name: 'Ivan', age: '23' }

// Get a specific query.
// Example: /users?name=Ivan&age=23
$router.qs('name'); // Ivan

// Get all params.
// Example: /users/1
$router.params(); // { id: '1' }

// Get a specific param.
// Example: /users/1
$router.params('id'); // 1
```

### Route Guards

The guards are functions that are executed before entering a route. They are very useful when we want to validate that the user has the necessary permissions to enter a route. Here's an example:

```ts
// Define your guard
const isAdminGuard = ({navigate}) => {
  const user = localStorage.getItem('user');

  if (user && user.role === 'admin') {
    return true;
  }

  navigate({path: '/login'});
  return false;
};

const routes: Route[] = [
  {
    path: '/admin',
    component: AdminPage,
    // Execute the guard before entering the route
    beforeEnter: [isAdminGuard],
  },
];
```

### API

Below is a list of all the methods available on the `Lit Router` API.

#### `.routes()`

Returns the list of routes.

#### `.setRoutes(routes: Partial<RouteConfig>[])`

Method responsible for setting application routes. It receives an array of type `RouteConfig` as a parameter.

#### `.navigate(navigation: Partial<Navigation>, options?: Partial<NavigationOptions>)`

Method responsible for navigating to a specific route. It receives an object of type `Navigation` as a parameter.

#### `.forward()`

Method responsible for navigating forward.

#### `.back()`

Method responsible for navigating back.

#### `.qs(name?: string)`

Method responsible for returning all queries or a specific query.

#### `.params(name?: string)`

Method responsible for returning all params or a specific param.

## TODO

### Server router integration

This client-side router is intended to be able to integrate with server-side routing, both configuration-based routers and convention-based routers like file-based routers.

Current ideas for integration include a fallback route handler (installed by the app) that delegates to a server API call that returns additional route configuration dynamically. The minimal API needed in the client router are:

1. The ability to dynamically add routes
2. Fallback route handlers.
