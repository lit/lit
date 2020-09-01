---
layout: guide
title: Lifecycle
slug: lifecycle
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

## Overview

LitElement-based components update asynchronously in response to observed property changes. Property changes are batched—if more properties change after an update is requested, but before the update starts, all of the changes are captured in the same update.

At a high level, the update lifecycle is:

1. A property is set.
2. Check whether an update is needed. If an update is needed, request one.
3. Perform the update:
  * Process properties and attributes.
  * Render the element.
4. Resolve a Promise, indicating that the update is complete.

####  LitElement and the browser event loop

The browser executes JavaScript code by processing a queue of tasks in the [event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop). In each iteration of the event loop, the browser takes a task from the queue and runs it to completion.

When the task completes, before taking the next task from the queue, the browser allocates time to perform work from other sources—including DOM updates, user interactions, and the microtask queue.

By default, LitElement updates are requested asynchronously, and queued as microtasks. This means that Step 3 above (Perform the update) is executed at the end of the next iteration of the event loop.

You can change this behavior so that Step 3 awaits a Promise before performing the update. See [`performUpdate`](#performUpdate) for more information.

For a more detailed explanation of the browser event loop, see [Jake Archibald's article](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/).

#### Lifecycle callbacks {#lifecyclecallbacks}

LitElement also inherits the default [lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks) from the Web Component standard:
* `connectedCallback`: Invoked when a component is added to the document's DOM.
* `disconnectedCallback`: Invoked when a component is removed from the document's DOM.
* `adoptedCallback`: Invoked when a component is moved to a new document.
* `attributeChangedCallback`: Invoked when component attribute changes.

<div class="alert alert-info">

**Be aware that adoptedCallback is not polyfilled.** 

</div>

**All lifecycle methods need to call the super method.** 

Example:

```js
connectedCallback() {
  super.connectedCallback()

  console.log('connected')
}
```

#### Promises and asynchronous functions

LitElement uses [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) objects to schedule and respond to element updates.

Using `async` and `await` makes it easy to work with Promises. For example, you can await the `updateComplete` Promise:

```js
// `async` makes the function return a Promise & lets you use `await`
async myFunc(data) {
  // Set a property, triggering an update
  this.myProp = data;

  // Wait for the updateComplete promise to resolve
  await this.updateComplete;
  // ...do stuff...
  return 'done';
}
```

Because `async` functions return a Promise, you can await them, too:

```js
let result = await myFunc('stuff');
// `result` is resolved! You can do something with it
```

See the [Web Fundamentals primer on Promises](https://developers.google.com/web/fundamentals/primers/promises) for a more in-depth tutorial.

## Assorted use cases

Common reasons to hook into the custom element lifecycle or the LitElement update lifecycle are initializations, managing derived data, and dealing with events that originate outside of your element's template. The following list provides some common use cases and approaches. In several cases there is more than one way to achieve a certain goal. Reading this list along with the detailed [technical reference](#reference) will provide you with a rather complete picture and enable you to decide what fits your component's needs best.

- Use [property.hasChanged](#haschanged) for **checking** "Is this a change? Do I want to run the update lifecycle?".
- Use the element [constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor) for [initializing LitElement properties](./properties#initialize) with **default values**. (*Attribute values* from the DOM are *not available* when the constructor runs.)
- Use [firstUpdated](#firstupdated) for **initializing private fields from DOM attributes** (as the constructor doesn't have access to them). Note that [render](#render) has already run at this point and your changes might trigger another update lifecycle. If it's imperative that you get access to attribute values *before* the first render happens, consider using [connectedCallback](#lifecyclecallbacks), but you'll need to do the extra logic for figuring out the "first" update yourself as [connectedCallback](#lifecyclecallbacks) can be called multiple times.
- Use [updated](#updated) for keeping **derived data** up to date or **reacting to changes**. If you find, that you're causing re-renders, consider using [update](#update) instead.
- Use custom [JS property getters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) for **derived data** that is "cheap" to calculate and if its not likely to change often and your element doesn't re-[render](#render) often.
- Use [requestUpdate](#requestupdate) to **trigger an update lifecycle** when LitElement cannot pick it up. (E.g. if you have an [observed property](./properties) that is an array, and you add an item to that array instead of replacing the entire array, LitElement won't "see" this change, because the *reference* to the array *didn't change*.)
- Use [connectedCallback](#lifecyclecallbacks) to register **event handlers** for outside your element's template, but don't forget to remove them in [disconnectedCallback](#lifecyclecallbacks)!

## Methods and properties reference {#reference}

In call order, the methods and properties in the update lifecycle are:

1.  [someProperty.hasChanged](#haschanged)
1.  [requestUpdate](#requestupdate)
1.  [performUpdate](#performupdate)
1.  [shouldUpdate](#shouldupdate)
1.  [update](#update)
1.  [render](#render)
1.  [firstUpdated](#firstupdated)
1.  [updated](#updated)
1.  [updateComplete](#updatecomplete)

### someProperty.hasChanged {#haschanged}

All declared properties have a function, `hasChanged`, which is called whenever the property is set; if `hasChanged` returns true, an update is scheduled.

See the Properties documentation for information on [configuring `hasChanged` to customize what constitutes a property change](/guide/properties#haschanged).

### requestUpdate {#requestupdate}

```js
// Manually start an update
this.requestUpdate();

// Call from within a custom property setter
this.requestUpdate(propertyName, oldValue);
```

| **Params**<br/><br/>&nbsp; | `propertyName`<br/><br/>`oldValue`| Name of property to be updated. <br/><br/> Previous property value. |
| **Returns**  | `Promise` | Returns the [`updateComplete` Promise](#updatecomplete), which resolves on completion of the update. |
| **Updates?** | No | Property changes inside this method will not trigger an element update. |

If [`hasChanged`](#haschanged) returned `true`, `requestUpdate` fires, and the update proceeds.

To manually start an element update, call `requestUpdate` with no parameters.

To implement a custom property setter that supports property options, pass the property name and its previous value as parameters.

**Example: Manually start an element update**

```js
{% include projects/lifecycle/requestupdate/my-element.js %}
```

{% include project.html folder="lifecycle/requestupdate" openFile="my-element.js" %}

**Example: Call `requestUpdate` from a custom property setter**

```js
{% include projects/properties/customsetter/my-element.js %}
```

{% include project.html folder="properties/customsetter" openFile="my-element.js" %}

### performUpdate {#performupdate}

```js
/**
 * Implement to override default behavior.
 */
performUpdate() { ... }
```

| **Returns** | `void` or `Promise` |  Performs an update. |
| **Updates?** | No | Property changes inside this method will not trigger an element update. |

By default, `performUpdate` is scheduled as a microtask after the end of the next execution of the browser event loop. To schedule `performUpdate`, implement it as an asynchronous method that awaits some state before calling `super.performUpdate()`. For example:

```js
async performUpdate() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  super.performUpdate();
}
```

{% include project.html folder="lifecycle/performupdate" openFile="my-element.js" %}

### shouldUpdate {#shouldupdate}

```js
/**
 * Implement to override default behavior.
 */
shouldUpdate(changedProperties) { ... }
```

| **Params** | `changedProperties`| `Map`. Keys are the names of changed properties; Values are the corresponding previous values. |
| **Returns**  | `Boolean` | If `true`, update proceeds. Default return value is `true`. |
| **Updates?** | Yes | Property changes inside this method will trigger an element update. |

Controls whether an update should proceed. Implement `shouldUpdate` to specify which property changes should cause updates. By default, this method always returns true.

**Example: Customize which property changes should cause updates**

```js
{% include projects/lifecycle/shouldupdate/my-element.js %}
```

{% include project.html folder="lifecycle/shouldupdate" openFile="my-element.js" %}

### update {#update}

| **Params** | `changedProperties`| `Map`. Keys are the names of changed properties; Values are the corresponding previous values. |
| **Updates?** | No | Property changes inside this method do not trigger an element update. |

Reflects property values to attributes and calls `render` to render DOM via lit-html. Provided here for reference. You don't need to override or call this method. But if you override it, make sure to call `super.update(changedProperties)` or [render](#render) will never be called.

### render {#render}

```js
/**
 * Implement to override default behavior.
 */
render() { ... }
```

| **Returns** | `TemplateResult` | Must return a lit-html `TemplateResult`. |
| **Updates?** | No | Property changes inside this method will not trigger an element update. |

Uses lit-html to render the element template. You must implement `render` for any component that extends the LitElement base class.

See the documentation on [Templates](/guide/templates) for more information.

### firstUpdated {#firstupdated}

```js
/**
 * Implement to override default behavior.
 */
firstUpdated(changedProperties) { ... }
```

| **Params** | `changedProperties`| `Map`. Keys are the names of changed properties; Values are the corresponding previous values. |
| **Updates?** | Yes | Property changes inside this method will trigger an element update. |

Called after the element's DOM has been updated the first time, immediately before [`updated`](#updated) is called.

Implement `firstUpdated` to perform one-time work after the element's template has been created.

**Example: Focus an input element on first update**

```js
{% include projects/lifecycle/firstupdated/my-element.js %}
```

{% include project.html folder="lifecycle/firstupdated" openFile="my-element.js" %}

### updated {#updated}

```js
/**
 * Implement to override default behavior.
 */
updated(changedProperties) { ... }
```

| **Params** | `changedProperties`| `Map`. Keys are the names of changed properties; Values are the corresponding previous values. |
| **Updates?** | Yes | Property changes inside this method will trigger an element update. |

Called when the element's DOM has been updated and rendered. Implement to perform some task after an update.

**Example: Focus an element after update**

```js
{% include projects/lifecycle/updated/my-element.js %}
```

{% include project.html folder="lifecycle/updated" openFile="my-element.js" %}

### updateComplete {#updatecomplete}

```js
// Await Promise property.
await this.updateComplete;
```

| **Type** | `Promise` | Resolves with a `Boolean` when the element has finished updating. |
| **Resolves** <br/><br/>| `true` if there are no more pending updates.<br/><br/> `false` if this update cycle triggered another update. |

The `updateComplete` Promise resolves when the element has finished updating. Use `updateComplete` to wait for an update:

  ```js
  await this.updateComplete;
  // do stuff
  ```

  ```js
  this.updateComplete.then(() => { /* do stuff */ });
  ```

**Example**

```js
{% include projects/lifecycle/updatecomplete/my-element.js %}
```

{% include project.html folder="lifecycle/updatecomplete" openFile="my-element.js" %}

#### Overriding updateComplete {#overriding-updatecomplete}

To await additional state before fulfilling the `updateComplete` promise, override the `_getUpdateComplete` method. For example, it may be useful to await the update of a child element here. First await `super._getUpdateComplete()`, then any subsequent state.

It's recommended to override the `_getUpdateComplete` method instead of the `updateComplete` getter to ensure compatibility with users who are using TypeScript's ES5 output (see [TypeScript#338](https://github.com/microsoft/TypeScript/issues/338)).

  ```js
  class MyElement extends LitElement {
    async _getUpdateComplete() {
      await super._getUpdateComplete();
      await this._myChild.updateComplete;
    }
  }
  ```

## Examples {#examples}

#### Control when updates are processed

[Implement `performUpdate`](#performupdate):

```js
async performUpdate() {
  await new Promise((resolve) => requestAnimationFrame(() => resolve());
  super.performUpdate();
}
```

{% include project.html folder="lifecycle/performupdate" openFile="my-element.js" %}

#### Customize which property changes should cause an update

[Implement `shouldUpdate`](#shouldupdate):

```js
shouldUpdate(changedProps) {
  return changedProps.has('prop1');
}
```

{% include project.html folder="lifecycle/shouldupdate" openFile="my-element.js" %}

#### Customize what constitutes a property change

Specify [`hasChanged`](#haschanged) for the property. See the [Properties documentation](properties#haschanged).

#### Manage property changes and updates for object subproperties

Mutations (changes to object subproperties and array items) are not observable. Instead, either rewrite the whole object, or call [`requestUpdate`](#requestupdate) after a mutation.

```js
// Option 1: Rewrite whole object, triggering an update
this.prop1 = Object.assign({}, this.prop1, { subProp: 'data' });

// Option 2: Mutate a subproperty, then call requestUpdate
this.prop1.subProp = 'data';
this.requestUpdate();
```

{% include project.html folder="lifecycle/subproperties" openFile="my-element.js" %}

#### Update in response to something that isn't a property change

Call [`requestUpdate`](#requestupdate):

```js
// Request an update in response to an event
this.addEventListener('load-complete', async (e) => {
  console.log(e.detail.message);
  console.log(await this.requestUpdate());
});
```

{% include project.html folder="lifecycle/requestupdate" openFile="my-element.js" %}

#### Request an update regardless of property changes

Call [`requestUpdate()`](#requestupdate):

```js
this.requestUpdate();
```

#### Request an update for a specific property

Call [`requestUpdate(propName, oldValue)`](#requestupdate):

```js
let oldValue = this.prop1;
this.prop1 = 'new value';
this.requestUpdate('prop1', oldValue);
```

{% include project.html folder="lifecycle/requestupdate" openFile="my-element.js" %}

#### Do something after the first update

Implement [`firstUpdated`](#firstupdated):

```js
firstUpdated(changedProps) {
  console.log(changedProps.get('prop1'));
}
```

{% include project.html folder="lifecycle/firstupdated" openFile="my-element.js" %}

#### Do something after every update

Implement [`updated`](#updated):

```js
updated(changedProps) {
  console.log(changedProps.get('prop1'));
}
```

{% include project.html folder="lifecycle/updated" openFile="my-element.js" %}

#### Do something when the element next updates

Await the [`updateComplete`](#updatecomplete) promise:

```js
await this.updateComplete;
// do stuff
```

```js
this.updateComplete.then(() => {
  // do stuff
});
```

#### Wait for an element to finish updating

Await the [`updateComplete`](#updatecomplete) promise:

```js
let done = await updateComplete;
```

```js
updateComplete.then(() => {
  // finished updating
});
```

{% include project.html folder="lifecycle/updatecomplete" openFile="my-element.js" %}
