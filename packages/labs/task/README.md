# @lit-labs/task

A controller for Lit that renders asynchronous tasks.

## Overview

Often a Lit element needs to request, process, and render remote data, for
example when querying a REST API for data to be displayed. The `Task`
controller provides a simple pattern for encapsulating this behavior in an
easily reusable way. The controller integrates with a host Lit element. The
user provides a task function and a dependencies function. Whenever the element
updates, the dependencies are checked and if any have changed, the task is
initiated. The controller requests an update of the element whenever the task
status changes. Task status is provided via the `TaskStatus` object which has
values for `INITIAL`, `PENDING`, `COMPLETE`, and `ERROR`. The task result is
available via its `value` property, or via the `error` property when an error
occurs. The task `render` method may also be used to easily render different
task states. It accepts an object which optionally can implement methods for
`initial`, `pending`, `complete(value)`, and `error(error)`. These methods
typically return a Lit `TemplateResult` to render

## Installation

From inside your project folder, run:

```bash
$ npm install @lit-labs/task
```

## Usage

Here's an example:

```ts
import {Task, TaskStatus} from '@lit-labs/task';
// ...

class MyElement extends LitElement {

  @state()
  private _userId: number;

  private _apiTask = new Task(
      this,
      ([userId]) =>
        fetch(`//example.com/api/userInfo?${userId}`)
          .then(response => response.json())
      () => [this.userId]
    );

  render() {
    return html`
      <div>User Info</div>
      ${this._apiTask.render({
        pending: html`Loading user info...`;
        complete(user): html`${user.name}`;
      })}
      <!-- ... -->
    `;
  }
}
```

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
