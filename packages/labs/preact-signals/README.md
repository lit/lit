# @lit-labs/preact-signals

Preact Signals integration for Lit.

## Why Signals?

Signals are an easy way to create shared observable state - state that many elements can use and update when it changes. This is great for things like a game state that many components need to read.

This use case can also be covered by state management solutions like Redux or MobX, observables like RxJS, or `EventTarget`s. Signals have a nice DX balance of being granular and composable, and having a fairly simple API.

Unlike in many frameworks, we do _not_ think that signals are going to be a big performance improvement for most Lit components. Updating Lit components is already very fast because Lit updates are batched and don't do a VDOM diff on each render; it only checks for which binding values have changed and updates the DOM for those bindings.

A Lit element template is already somewhat like a signal-produced value: it is computed based on updates to inputs (reactive properties). The difference with Lit templates is that the data flow is push-based, rather than pull-based. Lit elements react when changes are pushed into them, whereas signals automatically subscribe to the other signals they access. These approaches are very compatible though, and we can make elements subscribe to the signals they access and trigger an update with an integration library like this one.

## Why Preact Signals?

There are many signal libraries now, and unfortunately they are not seamlessly compatible (we can't generically watch all signal access and run an effect when they change across libraries). So we will need to support each library individually.

Preact Signals are a good place to start. They have integrations with other libraries, are shipped as standard JS modules, and seem comparatively small, fast, and high-quality.

## Usage

`SignalWatcher` is a mixin that makes an element watch all signal accesses during the element's reactive update lifecycle, then triggers an element update when signals change. This includes signals read in `shouldUpdate()`, `willUpdate()`, `update()`, `render()`, `updated()`, `firstUpdated()`, and reactive controller's `hostUpdate()` and `hostUpdated()`.

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

## Upcoming features

- A signal directive that performs targeted binding updates.
- An `html` template tag that automatically unwraps signals.
