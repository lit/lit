# @lit-labs/redux

Lit element bindings for Redux.

> **Warning** `@lit-labs/redux` is part of the Lit Labs set of packages – it is published
> in order to get feedback on the design and may receive frequent breaking changes.

## Overview

[Redux](https://redux.js.org/) is a JS library for predictable and maintainable global state management. This package provides a bindings layer for Redux, à la [`react-redux`](https://react-redux.js.org/), to be used with Lit elements.

The package provides a [Reactive Controller](https://lit.dev/docs/composition/controllers/) to hook into the reactive update cycle of the component to subscribe to a context provided Redux store and update on changes.

Decorators are also provided as an alternative way to select a piece of state into your component and subscribe to updates, or to provide a component with a way to dispatch actions.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/redux
```

## Usage

This [example project](../../../examples/redux/) contains a simple application showcasing usage examples.

Note: For instructions on how to create a Redux store, consult the [Redux quick start guide](https://redux.js.org/tutorials/quick-start). The steps involving React can be replaced with the steps below.

### Providing the store through Context

The bindings in this package will look for the Redux store to be provided via the [Web Components Community Group Context Protocol](https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md). For convenience, this package re-exports a couple of utilities for providing the context from [`@lit/context`](https://lit.dev/docs/data/context/).

#### Using the `ContextProvider` controller

```js
import {ContextProvider, storeContext} from '@lit-labs/redux';
import {store} from './store.js';

export class AppElement extends LitElement {

  _storeProvider = new ContextProvider(this, {
    context: storeContext,
    initialValue: store,
  });

  ...
}
```

#### Using the `@provide()` decorator

```ts
import {provide, storeContext} from '@lit-labs/redux';
import {store} from './store.js';

export class AppElement extends LitElement {
  @provide({context: storeContext})
  private _store = store;

  ...
}
```

### Connect a child component to the provided store

Note: The component must be a child of the provider above. Attempting to connect without a store provided via context will throw an error.

#### Using the `Connector` controller

```js
import {Connector} from '@lit-labs/redux';
import {increment} from './counter-slice.js';

export class CounterElement extends LitElement {
  _connector = new Connector(this, {
    selector: (state) => state.counter.value,
  });

  _incrementCount() {
    this._connector.dispatch(increment());
  }

  render() {
    return html`
      <span>Count: ${this._connector.selected}</span>
      <button @click=${this.incrementCount}>+</button>
    `;
  }
}
```

The `Connector` constructor takes an options object as its second argument with the following properties:

**`selector`**

A function that takes state and returns a selected value. A memoized selector may be used like one created with `reselect`.

If no selector function is provided, the controller will not subscribe to Redux store changes nor provide any selected value. Do this if you only wish to bring in the `dispatch` method to the component.

**`equalityCheck`**

A function used to check whether a selected value is different from the previously selected value.

It defaults to triple equals which will suffice for directly selecting values out of the state that's updating with immutable pattern, or if using a memoized selector using a library like [`reselect`](https://github.com/reduxjs/reselect).

Provide a custom function here if the selector returns derived data that's not memoized. The `@lit-labs/redux` package also exports a `shallowEquals` function for convenience.

---

The connector instance provides the following public properties:

**`selected`**

The value selected from state by the selector. It will be `undefined` if no selector was provided in the options.

**`dispatch`**

The `dispatch` method from the Redux store. Use this in other component methods to dispatch actions.

#### Using the `@connect()` and `@dispatch()` decorators

```ts
import {select, dispatch} from '@lit-labs/redux';
import {increment} from './counter-slice.js';

export class CounterElement extends LitElement {
  @select((state) => state.counter.value)
  _count;

  @dispatch()
  _dispatch;

  _incrementCount() {
    this._dispatch(increment());
  }

  render() {
    return html`
      <span>Count: ${this._count}</span>
      <button @click=${this.incrementCount}>+</button>
    `;
  }
}
```

The `@select()` decorator can take a selector function as an argument or an options object to be passed to the underlying `Connector` controller.

The `@dispatch()` decorator takes no arguments.

Note: Like all the Lit 3 decorators, these decorators will work as either TypeScript experimental decorators or [standard decorators](https://lit.dev/docs/components/decorators/#standard-decorators). When running as standard decorators, `@select()` decorated fields must also have the `accessor` keyword. `@dispatch()` decorated fields do not have this requirement.

### Usage with TypeScript

Similar to the Redux's [TypeScript quick start](https://redux.js.org/tutorials/typescript-quick-start) guide, the following are recommended ways of using this package for better type checking.

#### Define inferred store types

```ts
// store.ts
import {configureStore} from '@reduxjs/toolkit';

export const store = configureStore({
  ...
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Define typed `Connector` controller

```ts
// app-connector.ts

import {Connector} from '@lit-labs/redux';
import type {AppStore} from './store.js';

export const AppConnector = Connector.withStoreType<AppStore>();
```

#### Usage within component

Using the typed controller adds type information to the constructor and pubic fields of the instance, without needing to explicitly annotate them:

```ts
import {AppConnector} from './app-connector.js';

export class CounterElement extends LitElement {
  _connector = new AppConnector(this, {
    // `state` will be typed based on the configured store
    selector: (state) => state.counter.value,
  });

  _incrementCount() {
    // `this._connector.dispatch` will be typed to accept thunks
    this._connector.dispatch(increment());
  }

  render() {
    // Type of `this._connector.selected` will be inferred from the return type
    // of the selector function provided above.
    return html`
      <span>Count: ${this._connector.selected}</span>
      <button @click=${this.incrementCount}>+</button>
    `;
  }
}
```

For decorators, you can bring in `RootState` and `AppDispatch` types for use in the decorator argument or decorated fields:

```ts
import {select, dispatch} from '@lit-labs/redux';
import type {RootState, AppDispatch} from './store.js';

export class CounterElement extends LitElement {
  @select((state: RootState) => state.counter.value)
  _count!: number;

  @dispatch()
  _dispatch!: AppDispatch;
}
```

You may also need the non-null assertion `!` on the decorated fields to let TypeScript know that those fields will have assigned values by the decorator.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
