# @lit-labs/react

A React component wrapper for web components.

## Overview

While React can render Web Components, it [cannot](https://custom-elements-everywhere.com/libraries/react/results/results.html)
easily pass React props to custom element properties or event listeners.

This package provides a utility wrapper `createComponent` which makes a
React component wrapper for a custom element class. The wrapper correctly
passes React `props` to properties accepted by the custom element and listens
for events dispatched by the custom element.

## How it works

For properties, the wrapper interrogates the web component class to discover
its available properties. Then any React `props` passed with property names are
set on the custom element as properties and not attributes.

For events, `createComponent` accepts a mapping of React event prop names
to events fired by the custom element. For example passing `{onfoo: 'foo'}`
means a function passed via a `prop` named `onfoo` will be called when the
custom element fires the foo event with the event as an argument.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/react
```

## Usage

Import `React`, a custom element class, and `createComponent`.

```js
import * as React from 'react';
import {createComponent} from '@lit-labs/react';
import {MyElement} from './my-element.js';

export const MyElementComponent = createComponent(
  React,
  'my-element',
  MyElement,
  {
    onactivate: 'activate',
    onchange: 'change',
  }
);
```

After defining the React component, you can use it just as you would any other
React component.

```jsx
<MyElementComponent
  active={isActive}
  onactivate={(e) => (isActive = e.active)}
/>
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
