# @lit-labs/preact-signals

Preact Signals integration for Lit.

## Why Signals?

Signals are an easy way to create shared observable state - state that many elements can use and update when it changes. This is great for things like a game state that many components need to read.

This use case can also be covered by state management solutions like Redux or MobX, observables like RxJS, or `EventTarget`s. Signals have a nice DX balance of being granular and composable, and having a fairly simple API.

Unlike in many frameworks, we do _not_ think that signals are going to be a big performance improvement for most Lit components. Updating Lit components is already very fast because Lit updates are batched and don't do a VDOM diff on each render; it only checks for which binding values have changed and updates the DOM for those bindings.

A Lit element template is already somewhat like a signal-produced value: it is computed based on updates to inputs (reactive properties). The difference with Lit templates is that the data flow is push-based, rather than pull-based. Lit elements react when changes are pushed into them, whereas signals automatically subscribe to the other signals they access. These approaches are very compatible though, and we can make elements subscribe to the signals they access and trigger an update with an integration library like this one.

## Why Preact Signals?

There are many signal libraries now, and unfortunately they are not seamlessly compatible (we can't generically watch all signal access and run an effect when they change across libraries). So we will need to support each library individually.

Preact Signals are a good place to start. It has integrations with other libraries; is shipped as standard JS modules; and is small, fast, and high-quality.

## Usage

### SignalWatcher

`SignalWatcher` is a mixin that makes an element watch all signal accesses during the element's reactive update lifecycle, then triggers an element update when signals change. This includes signals read in `shouldUpdate()`, `willUpdate()`, `update()`, `render()`, `updated()`, `firstUpdated()`, and reactive controller's `hostUpdate()` and `hostUpdated()`.

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
      <p>The count is ${count.value}</p>
      <button @click=${this._onClick}>Increment<button></button></button>
    `;
  }

  private _onClick() {
    count.value = count.value + 1;
  }
}
```

Elements should not _write_ to signals in these lifecycle methods or they might cause an infinite loop.

### watch() directive

The `watch()` directive accepts a single Signal and renders its value, subscribing to updates and updating the DOM when the signal changes.

The `watch()` directive allows for very targeted updates of the DOM, which can be good for performance (but as always, measure!). The downside is that the lifecycle callbacks are not automatically watched for signal access, so values computed from signals must by wrapped in computed signals.

```ts
import {LitElement, html} from 'lit';
import {customElement, property} from 'lit';
import {watch, signal} from '@lit-labs/preact-signals';

const count = signal(0);

@customElement('signal-example')
export class SignalExample extends LitElement {
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
    count.value = count.value + 1;
  }
}
```

You can mix and match the `SignalWatcher` mixins and the `watch()` directive. When you pass a signal directly to `watch()` it is not accessed in a callback watched by `SignalWatcher`, so an update to that signal will cause a targeted DOM update and not an entire element update.

### html tag and withWatch()

This package also exports an `html` template tag that can be used in place of Lit's default `html` tag and automatically wraps any signals in `watch()`.

```ts
import {LitElement} from 'lit';
import {customElement, property} from 'lit';
import {html, signal} from '@lit-labs/preact-signals';

const count = signal(0);

@customElement('signal-example')
export class SignalExample extends LitElement {
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
    count.value = count.value + 1;
  }
}
```

`withWatch()` is a function that wraps an `html` tag function with the auto-watching functionality. This allows you to compose this wrapper with other html-tag wrappers like Lit's `withStatic()` static template wrapper.
