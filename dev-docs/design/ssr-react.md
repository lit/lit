# Server Rendering Lit Components in React

## Background

React server rendering of custom elements will only shallow render components by emitting the host element tag with props stringified to attributes and any light DOM children it has. `@lit-labs/ssr` is able to server render Lit elements deeply by emitting the contents of the component as Declarative Shadow DOM. We want usage of custom elements in React with server rendering to be able to take advantage of this as well.

Client rendering of custom elements in React have their shortfalls such as all props being set as attributes on the element and adding event listeners being clunky. We have the `createComponent` in `@lit/react` that creates a React Component that wraps the custom element which helps with this situation.

## Scenarios to Handle

<!-- prettier-ignore-start -->
| | With vanilla React | With Lit SSR packages in React |
| --- | --- | --- |
| Bare custom elements | <p>Here we simply rely on React's built in SSR which will render the custom element tag, setting all props as attributes. There's no content until JS with component definition is loaded in the client and the custom element is upgraded.</p><p>There is potential for Flash of Unstyled Content (FOUC) when the component has light DOM children as these won't have a slot to project to and show up unstyled in the initial document before upgrade, and content shifts as upgraded components fill up spaces.</p> | <p>To mirror the client-side React behavior, all props will be set as attributes on the element as it is server rendered with `@lit-labs/ssr`.<p><p>This will work fine for simple elements whose properties are all serializable and the attribute name matches the property name. More complex components may fail to render correctly.</p> |
| `@lit/react` wrapped components | <p>The experience here is mostly the same as bare custom elements. No deep server rendering happens. Only the host element tag is emitted. The wrapper prevents props that exist on the component as properties from being emitted as attributes. Component renders client side when definition is loaded.</p><p>The situation with FOUC and content shift exists just like bare custom elements.</p> | <p>The `createComponent` wrapper already separates props to those that should be set as properties on the element and those that can be passed to React to be set as attributes. In the server, the wrapper should specifically pass props that need to be set as properties on the element in a special bag so the element renderer can set as properties before rendering the template shadowroot.</p><p>On the client, Lit element hydration should be deferred until the wrapper has a chance to set properties on the element.</p> |
<!-- prettier-ignore-end -->

## Implementation Strategy

### `@lit-labs/ssr-react` package

We enhance React's element creation methods such that if we detect a custom element, we will use `@lit-labs/ssr` to render the shadow DOM content to a declarative shadow DOM template shadowroot element which we can provide as a child to the host custom element.

The default behavior of the element renderer here will be to set all props provided as attributes on the element as they're server rendered to match the base React client behavior. However, if the prop named `_$litProps$` is passed, this object will contain properties that will be set as properties on the element by the renderer. This will also cause the host element to have the `defer-hydration` attribute so that hydration can be paused on the client until all properties are set on it.

#### Patching `createElement`

The classic JSX transform compiles JSX to `React.createElement` calls. Our `@lit/react` wrapper also uses the `React` passed in by user to call `createElement` on it.

We can provided an alternate `createElement` function that applies the core strategy above.

For convenience, we can provide a side-effectful import that monkey patches `React.createElement` to be this alternate version.

Using export conditions, we can create a module `@lit-labs/ssr-react/enable-lit-ssr.js` that when imported in Node will monkey patch `React.createElement` and when imported in the browser will load the `@lit-labs/ssr-client/lit-element-hydrate-support.js`.

#### Using runtime JSX

The runtime JSX transform compiles JSX to various jsx function calls, importing `jsx` or `jsxs` from `<package>/jsx-runtime` or `jsxDEV` from `<package>/jsx-dev-runtime` depending on the environment and whether the `children` array was created statically.

We can provide alternate jsx functions that enhance the base React jsx functions with the core strategy above.

This is mainly for targeting bare custom elements as wrapped components must have `React.createElement` patched to work.

### `@lit/react` package

The wrapper made with `createComponent` from the Node build of this package will check whether `React.createElement` has been patched by checking if its `.name` matches ours. If so, it will pass element properties in a special prop named `_$litProps$` to `createElement` to be used for server rendering as described above.

On the client, the wrapper on mount will set properties on the element and remove the `defer-hydration` attribute to start Lit element hydration. It will also add `suppressHydrationWarning` to the prop of the host element to suppress React's warning for having extra attributes on the server rendered HTML like `defer-hydration`.

There was consideration of baking in the whole SSR template shadowroot generation into the Node build of `@lit/react` package itself which would remove the need for monkey patching `createElement`, but users would then have to make sure to manually load the `lit-element-hydrate-support` early anyway. It's not out of the realms of possiblity.

### `@lit-labs/nextjs` package

This is a plugin for Next.js projects to wrap the config in `next.config.js` adding custom webpack configs that automatically import `@lit-labs/ssr-react/enable-lit-ssr.js` and replace the `react/jsx-runtime` imports with `@lit-labs/ssr-react/jsx-runtime`. The goal is to cover all use case scenarios listed below without the user having to do extra work besides adding the plugin.

The use cases we want to cover are:

- Bare custom element tags as JSX
- `@lit/react` wrapped component as JSX
- External React components that contain custom elements pre-compiled with either classic or runtime JSX transform.

Importing `@lit-labs/ssr-react/enable-lit-ssr.js` will monkey patch `React.createElement` so users using classic JSX transforms or `@lit/react` wrapped components will get their custom elements server rendered. This also covers components pre-compiled with the classic transform.

Replacing the `react/jsx-runtime` imports with ours addresses users using the runtime JSX transform, and components pre-compiled with it.

While users do have some other ways of configuring React element creation like JSX pragmas or changing the jsx import source, they only cover the JSX transform for the project and do not apply to any pre-compiled React components brought into the project from other packages. They are also not composable so if the user is already using an alternate JSX transform, it is not easy to add on the Lit SSR transform on top of that. Monkey patching `React.createElement` and using webpack to replace `react/jsx-runtime` addresses all of these use cases.

## Additional Considerations

### Future React versions

We should investigate how [React's custom element support](https://github.com/facebook/react/issues/11347) works with server rendering.
