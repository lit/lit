# @lit-labs/signals

TC39 Signals Proposal integration for Lit.

> **Warning** `@lit-labs/signals` is part of the Lit Labs set of packages – it is published
> in order to get feedback on the design and may receive breaking changes.
>
> RFC: https://github.com/lit/rfcs/blob/main/rfcs/0005-standard-signals.md
>
> Give feedback: https://github.com/lit/lit/discussions/NNNN

## The TC39 Signals Proposal

The [TC39 Signals Proposal](https://github.com/tc39/proposal-signals) is a
proposal to add standard signals to the JavaScript language.

This is very exciting for web components, since it means that different web
components that don't use the same libraries can interoperably watch and produce
signals.

It also means that many existing state management systems and observability
libraries that might currently each require their own adapter to integrated with
the Lit lifecycle, might converge on using standard signals so that we only need
one Lit adapter, and eventually no adapter at all as support for signals is
directly added to Lit

## Why Signals?

Signals have several nice attributes for use with reactive components like Lit:

1. Signals are an easy way to create shared observable state - state that many
   elements can use and update when it changes. This is great for things like a
   game state that many components need to read.

2. Signals can be individually observed, and when used in a template binding,
   can be handled so that they only update the DOM their bound to. These
   targetted DOM updates don't re-render the entire template.

3. Standard signals are an observability interoperabiliy point that many
   different libraries can use. Any library that produces signals will work with
   any standard signal watcher.

4. Signals can be good for performance. Signals track dependencies and changes
   so that only signals that miht have changed and have been read are
   re-computd. This can help perform minimal computations and DOM updates when
   doing small updates to large signal graphs or UIs.

5. Signal auto-tracking can reduce the need for component-specific lifecycle
   APIs. For example, rather than having lifecycle callbacks for when updates
   have happened, or when specific reactive properties have changed, any code
   could create a reactive effect that simple accesses the signals it uses, and
   is automatically re-run when they change.

6. Signals may allow for interoperable _synchronous_ and _batched_ DOM updates.
   There are ways to respond to signal changes synchronously but also batched,
   so if reactive properties were backed by signals, an element could re-render
   itself once a batch of them had been updated. Elements could take care to
   update children inside of batches, meaning entire subtrees could be updated
   synchrously. The batching mechanism isn't standard yet, but could be an
   extension to the proposal.

Signals are a natural fit for Lit. A LitElement render method is already
somewhat like a computed signal in that it is computed based on updates to
inputs (reactive properties). The difference between Lit renders and signals is
that in Lit the data flow is push-based, rather than pull-based as in signals.
Lit elements react when changes are pushed into them, whereas signals
automatically subscribe to the other signals they access. But these approaches
are very compatible, and we can easily make elements subscribe to the signals
they access and trigger an update with an integration library like this one.

## Usage

### SignalWatcher

`SignalWatcher` is the core of signals integration. It's a mixin that makes an
element watch all signal accesses during the element's reactive update
lifecycle, then triggers an element update when signals change. This includes
signals read in `shouldUpdate()`, `willUpdate()`, `update()`, `render()`,
`updated()`, `firstUpdated()`, and reactive controller's `hostUpdate()` and
`hostUpdated()`.

This effectively makes the the return result of `render()` a computed signal.

```ts
import {LitElement, html} from 'lit';
import {customElement, property} from 'lit';
import {SignalWatcher, signal} from '@lit-labs/preact-signals';

const count = signal(0);

@customElement('signal-example')
export class SignalExample extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`
      <p>The count is ${count.get()}</p>
      <button @click=${this._onClick}>Increment<button></button></button>
    `;
  }

  private _onClick() {
    count.set(count.get() + 1);
  }
}
```

Elements should not _write_ to signals in these lifecycle methods or they might
cause an infinite loop.

### watch() directive

The `watch()` directive accepts a single Signal and renders its value,
subscribing to updates and updating the DOM when the signal changes.

The `watch()` directive allows for very targeted updates of the DOM, which can
be good for performance (but as always, measure!).

Updates from `watch()` directives are batched and commited during the next
reactive update. If there are only updates from `watch()` directives, then those
updates are commited without a full render - preserving both DOM coherence and
targetted updates. If there is another reactive update pending, then the whole
template is re-rendered, along with the latest signal values.

`watch()` must be used in conjunction with `SignalWatcher`.

```ts
import {LitElement, html} from 'lit';
import {customElement, property} from 'lit';
import {SignalWatcher, watch, signal} from '@lit-labs/preact-signals';

const count = signal(0);

@customElement('signal-example')
export class SignalExample extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`
      <p>The count is ${watch(count)}</p>
      <button @click=${this._onClick}>Increment<button></button></button>
    `;
  }

  private _onClick() {
    count.set(count.get() + 1);
  }
}
```

You can mix and match targetted updates with `watch()` directive and auto-tracking with `SignalWatcher`. When you pass a signal directly to `watch()` it is not accessed in a callback
watched by `SignalWatcher`, so an update to that signal will only cause a targeted
DOM update and not an full template render.

### html tag and withWatch()

This package also exports an `html` template tag that can be used in place of
Lit's default `html` tag and automatically wraps any signals in `watch()`.

```ts
import {LitElement} from 'lit';
import {customElement, property} from 'lit';
import {SignalWatcher, html, signal} from '@lit-labs/preact-signals';

const count = signal(0);

@customElement('signal-example')
export class SignalExample extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }
  `;

  render() {
    return html`
      <p>The count is ${count}</p>
      <button @click=${this._onClick}>Increment<button></button></button>
    `;
  }

  private _onClick() {
    count.set(count.get() + 1);
  }
}
```

`withWatch()` is a function that wraps an `html` tag function with the
auto-watching functionality. This allows you to compose this wrapper with other
html-tag wrappers like Lit's `withStatic()` static template wrapper.

## Future Work

This library will change based on feedback from developers. Some existing dieas we have for futher development are:

- A signal-aware `repeat()` directive that can update items in a list independently of the entire list.
- Signal aware `when()` directive that wraps the condition in a computed signal and watches it.
- A `@property()` decorator that creates a signal-backed property that can be watched.
- An `@effect()` method decorator that runs a method inside a watched computed signal, and re-runs it when any signal dependencies change. This would be an alternative the the common `@observe()` feature request.
- Batched synchronous updates, when using a utility like []`batchedEffect()`](https://github.com/proposal-signals/signal-utils?tab=readme-ov-file#batched-effects)
