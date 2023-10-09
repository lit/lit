# @lit-labs/ssr-react

A package for integrating Lit SSR with React and React frameworks.

## Overview

By default, React's SSR library renders custom elements _shallowly_, i.e. only the element's open and closing tags, attributes, and light DOM children are present in the server-rendered HTML - shadow DOM contents are not rendered.

This package provides tools to integrate [`@lit-labs/ssr`](../ssr/README.md) with React SSR so that Lit components are deeply rendered, including their shadow DOM contents.

## Usage

To get React SSR to deeply render Lit components, we'll need React JSX code to call an enhanced version of `createElement()` provided by this package. The way to achieve this depends on your project configuration.

### Using the Classic Runtime JSX Transform

The classic JSX transform replaces JSX expressions with `React.createElement()` function calls. In the default mode, it requires that `React` is imported and available in the scope of the JSX file.

This package provides a couple different ways to handle the classic runtime:

#### Monkey patching `React.createElement()` (recommended)

This package provides a module that, when imported in a server environment, has the side-effect of monkey patching `React.createElement()` to be enhanced to add the declarative shadow DOM output to registered custom elements. This can be imported at the entry point of the application before `React` is imported.

```js
// index.js
import '@lit-labs/ssr-react/enable-lit-ssr.js';

import React from 'react';
import ReactDOM from 'react-dom';

...
```

In the browser environment, this module does not patch `React.createElement()` but instead imports `@lit-labs/ssr-client/lit-element-hydrate-support.js` which must be imported before the `lit` package to allow hydration of server-rendered Lit elements.

This approach has the advantage of being compatible with Lit components wrapped as React components using the `@lit/react` package, which calls `React.createElement()` directly. It'll also work for any external React components pre-compiled with the classic JSX runtime transform.

#### Specifying an alternative `createElement()` function

If you wish to control which components use the enhanced `createElement()` function without a global monkey patch, you may do so by using a JSX pragma.

```diff
- import React from 'react';
+ /** @jsx createElement */
+ import {createElement} from '@lit-labs/ssr-react';

const Component = (props) => {
  return <my-element />;
}
```

You may also set the compiler options to specify the function to use instead of the JSX pragma.

- For Babel: set the [`pragma`](https://babeljs.io/docs/en/babel-preset-react#pragma) option for `@babel/preset-react` to `"createElement"`.
- For TypeScript: set the [`jsxFactory`](https://www.typescriptlang.org/tsconfig#jsxFactory) option in `tsconfig.json` to `"createElement"`.

Note that the import line must still be present for every file that contains JSX expressions to transform in the classic runtime mode.

This approach only works for server-rendering custom elements added to the project in JSX expressions. It will not affect any pre-compiled JSX expressions or direct calls to `React.createElement()`. You will also need to manually import the `@lit-labs/ssr-client/lit-element-hydrate-support.js` to your client JS. For those scenarios, use the [monkey patching](#monkey-patching-reactcreateelement-recommended) approach.

### Using the Automatic Runtime JSX Transform

If your project is using the [runtime JSX transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html), this package can serve as the JSX import source.

- For Babel: set the [`importSource`](https://babeljs.io/docs/en/babel-preset-react#importsource) option in `@babel/preset-react` to `@lit-labs/ssr-react`.
- For TypeScript: set the [`jsxImportSource`](https://www.typescriptlang.org/tsconfig#jsxImportSource) option in `tsconfig.json` to `@lit-labs/ssr-react`.

These JSX runtime modules contain jsx functions enhanced to add the declarative shadow DOM output to registered custom elements when imported into server environemtns. They also automatically import `@lit-labs/ssr-client/lit-element-hydrate-support.js` in the browser environment.

This method will not work for any pre-compiled JSX expressions or direct calls to `React.createElement()`, including those in the usage of the `@lit/react` package's `createComponent()`. Consider combining this with the [monkey patching](#monkey-patching-reactcreateelement-recommended) approach to handle such scenarios.

In the unlikely event that you wish to use React components that are pre-compiled with the automatic transform, i.e. those already written using `jsx` or `jsxs` functions, that also contain Lit components you wish to SSR, a build tool will need to be used to replace the import source of those functions to be from `@lit-labs/ssr-react`.

### Advanced Usage

For composing multiple `createElement()` functions, e.g. for use along side other React libraries that enhancee `createElement()`, this package also provides a `wrapCreateElement()` function which accepts a `createElement()` function and returns an enhanced one.

```js
import {wrapCreateElement} from '@lit-labs/ssr-react';
import React from 'react';

const enhancedCreateElement = wrapCreateElement(React.createElement);
```

## How it Works

The enhancements to `React.createElement()` or runtime JSX functions work by adding a `<template shadowrootmode>` element to the custom element's `children` list, if the custom element is defined and has a Lit SSR `ElementRenderer` registered to SSR the element. By default, all `LitElement` subclasses are rendered by the built-in `LitElementRenderer`.

### Handling of Props

For bare custom elements, all props provided by React are set as **attributes** on the element during server rendering, as is the default behavior for custom elements rendered by React on the client (as of version 18). This works for simple components whose properties can easily be represented as attributes, i.e. they are easily serialized/deserialized and the attribute name does not differ with the property name.

For Lit elements wrapped with `@lit/react`'s `createComponent()`, properties present on the element will be set as **properties** instead of **attributes** for server rendering. Client side hydration will also be deferred such that it'll wait for element properties to be set before the first update happens. Note: this is only made available by the [monkey patching](#monkey-patching-reactcreateelement-recommended) approach.

## Enabling Declarative Shadow DOM

As of February 2023, declarative shadow DOM is supported in Chromium and Safari Technology Preview. For browsers that do not yet support it, you must include the [`template-shadowroot`](https://github.com/webcomponents/template-shadowroot) polyfill. Without this, React's own hydration may warn of hydration mismatch due to the lingering `<template>` element. See https://lit.dev/docs/ssr/client-usage/#using-the-template-shadowroot-polyfill for inspiration on how to incorporate this into your application.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
