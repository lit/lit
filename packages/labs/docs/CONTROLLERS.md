# Objective

Component authors sometimes need to share reusable bits of logic between components that are something less than a full component. They may be stateful, need to run logic at element lifecycle events, or trigger element updates.

Functionally, these units of state and behavior are very similar to class mixins. We want them to be able to access instance state and methods of the host component, and hook lifecycle methods like update() and connectedCallback(). The key difference from mixins is that a host component may have multiple instances of a controller class.

Controllers fill many of the same needs as React hooks and the Vue composition API.

# Goals

- Create a pattern for composable LitElement controllers
- Allow controllers to hook various LitElement lifecycle callbacks
- Allow directives to hook lifecycle callbacks
- Keep it simple: We are not trying to create a new programming paradigm

# Non-Goals

- Compatibility with other existing systems

# Design Overview

A controller is a bit like a mini-component. It can have state and lifecycle just like a UpdatingElement component, but itself is not an HTML element, and does not drive its own lifecycle, but is driven by the host.

Usage of a controller would look like this:

```js
class MyElement extends LitElement {
  _controller = new MyController(this);

  render() {
    const aValue = this._controller.value;
    return html`<p>${aValue}</p>`;
  }
}
```

Note that the API surface of the controller isn't specified - it can have whatever properties and methods are most appropriate. The only convention is that the controller receives a reference to the host, with which it can trigger updates and be called on lifecycle events.

## API provided in UpdatingElement

A controller is an object which can hook into the lifecycle of an UpdatingElement or LitElement. The following lifecycle entry points are provided, each of which can optionally be implemented by controllers:

- `connectedCallback`: called via the element's `connectedCallback`
- `disconnectedCallback`: called via the element's `disconnectedCallback`
- `willUpdate(changedProperties)`: called before the element's `willUpdate` method.
- `update(changedProperties)`: called before the element's `update` method.
- `didUpdate(changedProperties)`: called before the element's `didUpdate` method.

For adding and removing controllers:

- `addController(controller)`: adds a controller to the element's lifecycle. Controllers should typically be added in an element's constructor so they can access the entire lifecycle of the element.

The implementation of an example controller would look something like:

```js
class MyController {
  host: UpdatingElement;

  #value;
  #interval;

  get value() {
    return this.#value;
  }

  set value(v) {
    this.#value = v;
    this.host.requestUpdate();
  }

  constructor(host: UpdatingElement) {
    this.host = host;
  }

  connectedCallback() {
    this.#interval = setInterval(() => {
      this.value = Math.random();
    }, 1000);
  }

  disconnected() {
    clearInterval(this.#interval);
  }
}
```

The controller can have basically any set of state, methods, and external subscriptions. It's just an object that interacts with its host element's state and lifecycle APIs.

Note, controllers can also be composed inside other objects like lit-html directives.

## Lifecycle use cases

### constructor

Classes have a constructor which can be used as usual for initialization. Controllers can be created via factory functions as well.

### connectedCallback

Can be used to add global event listeners, or fire events for example, to implement a pending-state or context API.

### disconnectedCallback

Can be use to clean up work done in connected.

### willUpdate

Can be used to calculate derived state using element state. Note, this will be called during server rendering and therefore should not access element DOM.

### update

Access element DOM state, layout, and other styles, etc. Animation directives that need to record the initial state of an animated element are a prime use case.

### didUpdate

Can be used to introspect and measure DOM, add event handlers on rendered DOM, etc.

## Composition and Reactivity

Composition is a hugely important factor in reusable code - we want users to be able to easily combine third-party controllers to make a custom controller.

In addition, as in LitElement we want to make it easy to trigger a host update when observable controller state changes.

### Composition

A controller is typically a class that has a `host` argument passed in its constructor and calls `host.addController(this)`. To facilitate controller composition, a controller can instantiate other controllers and add them to its host as in this example:

```js
class MyController {
  constructor(host) {
    this.host = host;
    this.host.addController(this);
    this.subController = new SubController(this.host);
  }
}
```

### Reactivity

To facilitate reactivity, a controller need only call `this.host.requestUpdate`. This will requests an update on its host.

### UpdatingController Class

`UpdatingController` is a minimal controller base class designed to make these patterns more ergonomic. It automatically sets up the `host` property and supprots defining reactive properties similar to UpdatingElement:

```ts
export class MouseController extends UpdatingController {
  @property()
  position?: [number, number];

  _onMouseMove = ({clientX, clientY}) => {
    // This reactive property triggers an update on the host element.
    this.position = [clientX, clientY];
  };

  connectedCallback() {
    window.addEventListener('mousemove', this._onMouseMove);
  }

  disconnectedCallback() {
    window.removeEventListener('mousemove', this._onMouseMove);
  }
}
```

## Performance

Creating and using an `UpdatingController` in an element imposes a small performance penalty of _~5%_ on a minimal targeted benchmark. This is slightly more expensive than using a mixin approach, but it provides additional capabilities described above that often make using a controller worth it. See the benchmarks package for runnable benchmarks.

## Motivating Example Use Cases

### Context / Dependency Injection (DI)

Controllers can be used to create an event-based context / DI system that has similar API and behavior to React's context APIs.

In one module we'll create a new context object, and from it `Provider` and `Consumer` controller constructors:

```js
// Create a new context with no default value
const userContext = createContext(undefined);

// A provider controller
export const UserProvider = userContext.provider;

// A consumer controller
export const UserConsumer = userContext.consumer;
```

A container element may provide a value to its subtree:

```js
class MyApp extends LitElement {
  _userProvider = new UserProvider(this);

  set user(v) {
    this._userProvider.value = v;
  }

  render() {
    return html` <my-element></my-element> `;
  }
}
```

A consumer of the value can create a controller to receive it:

```js
class MyElement extends LitElement {
  _user = new UserConsumer(this);

  render() {
    return html`
      <div>
        ${this._user.value
          ? html`<p>User: ${this._user.value}</p>`
          : html`<p>No User</p>`}
      </div>
    `;
  }
}
```

### Redux

Example from Redux-React useSelector() hook:

```js
export const TodoListItem = props => {
  const todos = useSelector((state) => state.todos);
  return todo.text.map((t) => ...);
}
```

Done as a controller, first we need a provider of the store. This can piggy-back on the context controllers.

```js
import {store} from './store.js';

class MyApp extends LitElement {
  _storeProvider = new StoreProvider(store);

  render() {
    return html` <todo-list></todo-list> `;
  }
}
```

Then, a selector controller for a consumer of the store:

```js
class TodoList extends LitElement {
  _todoSelector = new Selector(this, (state) => state.todos);

  render() {
    const todos = this._todoSelector.select();
    return html`${repeat(todos, ...}`;
  }
}
```

### MobX

MobX is included as example of something that's better as a mixin. Since MobX observation is global, there's never a need for more than one MobX controller on a host. The `lit-mobx` mixin also needs no configuration, unlike the Redux mixins, so the ergonomics aren't bad. It certainly could be a controller.

### Asynchronous Tasks

An AsyncTask controller can take a task function and a dependency function. It will call the task function when the dependencies change. The task completing will update the element, so the value can be accessed synchronously in `render()`:

```js
class FetchElement extends LitElement {
  @property() src: string;

  _fetchTask = new AsyncTask(this,
    async (src) => (await fetch(src)).text(),
    () => [this.src]);

  render() {
    return html`${this._fetchTask.isPending ? html`<p>Waiting...</p>` : html`<pre>${this._fetchTask.value}</pre>` `;
  }
}
```

This controller could have a method that accepts templates for the various task states (initializing, pending, complete, failure), like the proposed `runAsync()` directive.

It can also fire `pending-state` events on the host when the task is started.

### Spring

Springs are an example of a stateful animation controller that needs to trigger host updates.

```js
class SpringyThing extends LitElement {
  _spring = new SpringController(this, {
    mass: 10,
    stiffness: 400,
    damping: 500,
    position: 10,
  });

  render() {
    const pos = this._spring.currentPosition;
    return html`<div style="transform: translateX(${pos}px)"></div>`;
  }
}
```

In the example the spring controller's initial position starts it in motion, and when its internal scheduler (rAF) fires it calls host.requestUpdate().

This is a controller because a host can have multiple SpringController instances.

### Material Motion

The Material Design motion specification describes several complex multi-element transitions. We would like to be able to implement a transition as a reusable object and wire it to the right elements.

See https://material.io/design/motion/choreography.html#sequencing

```js
class MainView extends LitElement {
  _transform = new ContainerTransform(this);

  render() {
    return html`
      <mwc-list style=${this._transform.containerStyles}>
        ${repeat(
          this.items,
          (i) => html`
            <mwc-list-item style=${this._transform.outgoingStyle}>
            </mwc-list-item>
          `
        )}
      </mwc-list>
      <details-view
        item=${this.selectedItem}
        style=${this._transform.incomingStyle}
      >
      </details-view>
    `;
  }
}
```

### Mouse

A mouse controller can update the element when the mouse moves.

```js
class MouseCoordinatesElement extends LitElement {
  _mouse = new MouseController(this);

  render() {
    const [x, y] = this._mouse.position;
    return html`<p>Current mouse position is x: ${x}, y: ${y}</p>`;
  }
}
```

This is a simplistic example, we'd probably want ways to start and stop listening.

### FLIP Animation Directive

A [FLIP](https://aerotwist.com/blog/flip-your-animations/) animation directive can function as a controller. It would measure initial DOM state in the `willUpdate` callback and perform the FLIP animation in the `didUpdate` callback.

### Others

- Intersection, Resize and Mutation Observers
- Keyboard events
- Theming
- RadioButtonGroup
- ListController
- TreeController
