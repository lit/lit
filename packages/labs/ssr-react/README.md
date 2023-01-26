# @lit-labs/ssr-react

A package for integrating Lit SSR with React and React frameworks.

## Overview

When server rendering React components that include custom elements authored with Lit, these are shallowly rendered i.e. only the host element's open and closing tags are present in the server rendered HTML generated, not any of its contents.

This package provides tools to integrate with React's JSX transform and element creation such that Lit components will be deeply rendered to include their shadow DOM contents as declarative shadow DOM using [`@lit-labs/ssr`](../ssr/README.md) in the server rendered HTML created by `ReactDOMServer`.

## Usage

This package includes several ways of adding Lit SSR integration to React's base element creation to address different JSX transforms as well as pre-compiled components.

### Using the Classic JSX Transform

The classic JSX transform replaces JSX with `React.createElement` function calls.

This package provides the `patchCreateElement` function which takes the `React.createElement` function and returns an enhanced function that adds a template shadowroot element as a child to the host custom element for any registered Lit components it gets.

```js
import React from 'react';
import {patchCreateElement} from `@lit-labs/ssr-react`;

const patchedCreateElement = patchCreateElement(React.creatElement);
```

When compiling your source code's JSX to js, you can instruct your tool to use the `patchedCreateElement` function instead of React's original `createElement` by

#### Adding a JSX pragma

```js
/** @jsx patchedCreateElement */
```

#### Or, configuring your compiler

- For Babel: specify the [`pragma`](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#pragma) option for `@babel/plugin-transform-react-jsx`.
- For TypeScript: specify the [`jsxFactory`](https://www.typescriptlang.org/tsconfig#jsxFactory) option in `tsconfig.json`.

Note: Both of the solutions above require the function `patchedCreateElement` (or whatever specifier you choose for the patched function) already be present in scope of the file with JSX to transform. Each `jsx`/`tsx` file will need to include the code snippet at the top of this section. Therefore, it is recommended to use the `@lit-labs/ssr-react/enable-lit-ssr.js` module mentioned below.

### Using the Runtime JSX Transform

If your project is using the [runtime JSX transform](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html), this package is configured to be able to serve as the JSX import source whose JSX functions have been patched to enable Lit SSR.

- For Babel: specify the [`importSource`](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#importsource) option in `@babel/plugin-transform-react-jsx` as `@lit-labs/ssr-react`.
- For TypeScript: specify the [`jsxImportSource`](https://www.typescriptlang.org/tsconfig#jsxImportSource) option in `tsconfig.json` as `@lit-labs/ssr-react`.

### Monkey patching `React.createElement`

This package provides a module that, when imported, has a side-effect of monkey patching `React.createElement` to be the patched version. This can be imported at the entry point of the application before `React` is imported.

```js
import '@lit-labs/ssr-react/enable-lit-ssr.js';
```

The advantage of this approach is that it does not require modification to any other files containing JSX. It will also work for external components that have been pre-compiled with the classic JSX transform or React components made from Lit components using `@lit-labs/react`.

### Note on Enabling Hydration

Both the Runtime JSX Transform replacement and using `@lit-labs/ssr-react/enable-lit-ssr.js` have conditional exports configured such that when imported for a server environment they enhance React's original element creation to deeply render Lit components, and when imported for the browser will bring in `lit/experimental-hydrate-support.js` and provide pass-throughs for React's original element creation.

If you are not using either of the above methods, you must manually import `lit/experimental-hydrate-support.js` into your source code before `lit-element` is loaded.

### Other considerations

For browsers that do not yet support declarative shadow DOM, you must include the [`template-shadowroot`](https://github.com/webcomponents/template-shadowroot) polyfill. Without this, React's own hydration may complain of hydration mismatch due to the lingering `<template>` element. See https://lit.dev/docs/ssr/client-usage/#using-the-template-shadowroot-polyfill for inspiration on how to incorporate this into your application.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
