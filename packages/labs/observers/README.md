# @lit-labs/observers

Reactive controllers that make it easy to use the web platform observer
classes with Lit.

[![Build Status](https://github.com/lit/lit/workflows/Tests/badge.svg)](https://github.com/lit/lit/actions?query=workflow%3ATests)
[![Published on npm](https://img.shields.io/npm/v/@lit-labs/observers.svg?logo=npm)](https://www.npmjs.com/package/@lit-labs/observers)
[![Join our Discord](https://img.shields.io/badge/discord-join%20chat-5865F2.svg?logo=discord&logoColor=fff)](https://lit.dev/discord/)
[![Mentioned in Awesome Lit](https://awesome.re/mentioned-badge.svg)](https://github.com/web-padawan/awesome-lit)

`@lit-labs/observers` includes reactive controllers for:

- MutationObserver
- ResizeObserver
- IntersectionObserver
- PerformanceObserver

> [!WARNING]
>
> This package is part of [Lit Labs](https://lit.dev/docs/libraries/labs/). It
> is published in order to get feedback on the design and may receive breaking
> changes or stop being supported.
>
> Please read our [Lit Labs documentation](https://lit.dev/docs/libraries/labs/)
> before using this library in production.
>
> Give feedback: https://github.com/lit/lit/discussions/3355

## Overview

The modern web platform provides a number of observer helpers that can be used
to detect changes to which web applications may want to react. By managing
one of these observers with a reactive controller, changes can be easily
integrated into the Lit reactive update lifecycle. The controller can also help
manage observer cleanup and rendering in response to changes.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/observers
```

## Usage

### IntersectionController

IntersectionController attaches a [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to the host and requests
updates whenever the IntersectionObserver observes changes to the intersection
state of the targets.

The controller can also compute and store an arbitrary value each time changes
occur.

#### Import

```ts
import {IntersectionController} from '@lit-labs/observers/intersection-controller.js';
```

#### Constructor

```ts
constructor(
  host: ReactiveControllerHost & Element,
  {target, config, callback, skipInitial}: IntersectionControllerConfig<T>
)
```

#### Config

- `config: IntersectionObserverInit`: Configuration object for the
  IntersectionObserver.
- `target?: Element | null`: The element to observe. In addition to configuring
  the target here, the `observe` method can be called to observe additional
  targets. When not specified, the target defaults to the `host`. If set to
  `null`, no target is automatically observed. Only the configured target will
  be re-observed if the host connects again after unobserving via disconnection.
- `callback?: IntersectionValueCallback<T>`: The callback used to process detected
  changes into a value stored in the controller's `value` property.
- `skipInitial?: boolean`: By default the `callback` is called without changes
  when a target is observed. This is done to help manage initial state, but this
  setup step can be skipped by setting this to true.

#### Properties and Methods

- `value?: T`: The result of processing the observer's changes via the
  `callback` function passed to the config.
- `observe(target: Element)`: Observe the target element. The controller's
  `target` is automatically observed when the host connects.
- `unobserve(target: Element)`: Unobserve the target element.
- `disconnect()`: Disconnects the observer. This is done automatically when the
  host disconnects.

### MutationController

MutationController attaches a [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) to the host and requests updates
whenever the MutationObserver observes changes to the DOM.

The controller can also compute and store an arbitrary value each time changes
occur.

#### Example

```ts
import {MutationController} from '@lit-labs/observers/mutation-controller.js';
// ...

class MyElement extends LitElement {
  private _observer = new MutationController(this, {
    config: {attributes: true},
  });

  render() {
    return html` ${this._observer.value ? `Attributes set!` : ``} `;
  }
}
```

#### Import

```ts
import {MutationController} from '@lit-labs/observers/mutation-controller.js';
```

#### Constructor

```ts
new MutationController<T = unknown>(
  host: ReactiveControllerHost & Element,
  {target, config, callback, skipInitial}: MutationControllerConfig<T>
)
```

The type parameter `<T>` is the type of the `value` property and the return
type of the `callback` option.

#### MutationControllerConfig

- `config: MutationObserverInit`: Configuration object for the MutationObserver.
- `target?: Element | null`: The element to observe. In addition to configuring
  the target here, the `observe` method can be called to observe additional
  targets. When not specified, the target defaults to the `host`. If set to
  `null`, no target is automatically observed. Only the configured target will
  be re-observed if the host connects again after unobserving via disconnection.
- `callback?: MutationValueCallback<T>`: The callback used to process detected
  changes into a value stored in the controller's `value` property.
- `skipInitial?: boolean`: By default the `callback` is called without changes
  when a target is observed. This is done to help manage initial state, but this
  setup step can be skipped by setting this to true.

#### Properties and Methods

- `value`: The result of processing the observer's changes via the `callback`
  function passed to the config.
- `observe(target: Element)`: Observe the target element. The controller's
  `target` is automatically observed when the host connects.
- `disconnect()`: Disconnects the observer. This is done automatically when the
  host disconnects.

### PerformanceController

PerformanceController attaches a [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) to the host and requests
updates whenever the PerformanceObserver observes receives new performance
metrics.

#### Import

```ts
import {PerformanceController} from '@lit-labs/observers/performance-controller.js';
```

#### Constructor

```ts
constructor(
  host: ReactiveControllerHost,
  {config, callback, skipInitial}: PerformanceControllerConfig<T>
)
```

#### PerformanceControllerConfig

- `config: PerformanceObserverInit`: Configuration object for the MutationObserver.
- `callback?: PerformanceValueCallback<T>`: The callback used to process detected
  changes into a value stored in the controller's `value` property.
- `skipInitial?: boolean`: By default the `callback` is called without changes
  when a target is observed. This is done to help manage initial state, but this
  setup step can be skipped by setting this to true.

#### Properties and Methods

- `value`: The result of processing the observer's changes via the `callback`
  function passed to the config.
- `observe(target: Element)`: Observe the target element. The controller's
  `target` is automatically observed when the host connects.
- `disconnect()`: Disconnects the observer. This is done automatically when the
  host disconnects.

### ResizeController

ResizeController attaches a [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to the host and requests updates
whenever the ResizeObserver detects size changes to its targets. The controller
can also compute and store an arbitrary value each time changes occur.

#### Import

```ts
import {ResizeController} from '@lit-labs/observers/resize-controller.js';
```

#### Constructor

```ts
constructor(
  host: ReactiveControllerHost & Element,
  {target, config, callback, skipInitial}: ResizeControllerConfig<T>
)
```

#### ResizeControllerConfig

- `config?: ResizeObserverOptions`: Configuration object for the
  ResizeController.
- `target?: Element | null`: The element to observe. In addition to configuring
  the target here, the `observe` method can be called to observe additional
  targets. When not specified, the target defaults to the `host`. If set to
  `null`, no target is automatically observed. Only the configured target will
  be re-observed if the host connects again after unobserving via disconnection.
- `callback?: ResizeValueCallback<T>`: The callback used to process detected
  changes into a value stored in the controller's `value` property.
- `skipInitial?: boolean`: By default the `callback` is called without changes
  when a target is observed. This is done to help manage initial state, but this
  setup step can be skipped by setting this to true. }

#### Properties and Methods

- `value?: T`: The result of processing the observer's changes via the
  `callback` function passed to the config.
- `observe(target: Element)`: Observe the target element. The controller's
  `target` is automatically observed when the host connects.
- `unobserve(target: Element)`: Unobserve the target element.
- `disconnect()`: Disconnects the observer. This is done automatically when the
  host disconnects.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
