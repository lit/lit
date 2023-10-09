# @lit/task

A controller for Lit that renders asynchronous tasks.

## Overview

Often a Lit element needs to request, process, and render remote data, for
example when querying a REST API for data to be displayed. The `Task`
controller provides a simple pattern for encapsulating this behavior in an
easily reusable way. The controller integrates with a host Lit element. The
user provides a task function and an arguments function. Whenever the element
updates, the arguments are checked and if any have changed, the task is
initiated.

Sometimes it's important to control exactly when a task runs. For example,
task arguments may have changed, but it should not run until an interaction
event like a button click. For these types of use cases, the `autoRun` option
can be set to `false`. This setting can be passed in the task configuration
and/or be set on the `Task` itself. It defaults to `true`, but when `autoRun`
is `false`, the task does not run automatically when arguments change.
Instead, it can be run explicitly by calling `run(arg?)`. By default, `run()`
uses the task's configured arguments function, but a custom array of arguments
may be optionally passed.

The controller requests an update of the element whenever the task
status changes. Task status is provided via the `TaskStatus` object which has
values for `INITIAL`, `PENDING`, `COMPLETE`, and `ERROR`. The task result is
available via its `value` property, or via the `error` property when an error
occurs. The task `render` method may also be used to easily render different
task states. It accepts an object which optionally can implement methods for
`initial`, `pending`, `complete(value)`, and `error(error)`. These methods
typically return a Lit `TemplateResult` to render.

## Installation

From inside your project folder, run:

```bash
$ npm install @lit/task
```

## Usage

Here's an example:

```ts
import {Task, TaskStatus} from '@lit/task';
// ...

class MyElement extends LitElement {
  @state()
  private _userId: number = -1;

  private _apiTask = new Task(
    this,
    ([userId]) =>
      fetch(`//example.com/api/userInfo?${userId}`).then((response) =>
        response.json()
      ),
    () => [this._userId]
  );

  render() {
    return html`
      <div>User Info</div>
      ${this._apiTask.render({
        pending: () => html`Loading user info...`,
        complete: (user) => html`${user.name}`,
      })}
      <!-- ... -->
    `;
  }
}
```

### Argument equality

Task accepts an `argsEqual` to determine if a task should auto-run by testing a new arguments array for equality against the previous run's arguments array.

The default equality function is `shallowArrayEquals`, which compares each argument in the array against the previous array with `notEqual` from `@lit/reactive-element` (which itself uses `===`). This works well if your arguments are primitive values like strings.

If your arguments are objects, you will want to use a more sophisticated equality function. Task provides `deepArrayEquals` in the `deep-equals.js` module, which compares each argument with a `deepEquals` function that can handle primitives, objects, Arrays, Maps, Sets, RegExps, or objects that implement `toString()` or `toValue()`.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
