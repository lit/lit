---
layout: guide
title: Events
slug: events
---

{::options toc_levels="1..3" /}
* ToC
{:toc}


## Where to add your event listeners

You need to add event listeners in a method that is guaranteed to fire before the event occurs. However, for optimal loading performance, you should add your event listener as late as possible.  

The most common ways to add an event listener:

* Declaratively, in  your component's template
* In the component constructor, for listeners added on the component itself.
* In the `connectedCallback`, for listeners that need to reference DOM outside the component (for example, `Window` or `Document`).
* After first paint, if you're adding a lot of listeners and first paint performance is critical.


### Add declarative event listeners

You can use lit-html `@event` bindings in your template to add event listeners to your component. 

**Example**

```js
render() {
  return html`<button @click="${this._handleClick}">`;
}
```

Declarative event listeners are added when the template is rendered. This is usually the best way to add listeners to elements in your templated DOM.

### Add event listeners in the constructor

If you need to listen for an event that might occur before your component has been added to DOM, you might need to add the event listener in your component's constructor. 

The component constructor is a good place to add event listeners on the host element itself.

**Example**

```js
constructor() {
  super();
  this.addEventListener('focus', this._handleFocus);
}
```

### Add event listners in `connectedCallback`

`connectedCallback` is a lifecycle callback in the custom elements API. `connectedCallback` fires each time a custom element is appended into a document-connected element. See [the MDN documentation on using custom elements lifecycle callbacks](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks) for more information.

If your component adds an event listener to anything except itself or its children–for example, to `Window`, `Document`, or some element in the main DOM–you should add the listener in `connectedCallback` and remove it in `disconnectedCallback`.

*   Removing the event listener in `disconnectedCallback` ensures that any memory allocated by your component will be cleaned up when your component is destroyed or disconnected from the page. 

*   Adding the event listener in `connectedCallback` (instead of, for example, the constructor or `firstUpdated`) ensures that your component will re-create its event listener if it is disconnected and subsequently reconnected to DOM.

**Example**

```js
connectedCallback() {
  super.connectedCallback();
  window.addEventListener('resize', this._handleResize);
}
disconnectedCallback() {
  window.removeEventListener('resize', this._handleResize);
  super.disconnectedCallback();
}
```

### Add event listeners after first paint

Sometimes, you may want to defer adding an event listener until after first paint—for example, if you're adding a lot of listeners and first paint performance is critical.

LitElement doesn't have a specific lifecycle callback called after first paint, but you can use this pattern with the `firstUpdated` lifecycle callback:

```js
async firstUpdated() {
  // Give the browser a chance to paint
  await new Promise((r) => setTimeout(r, 0));
  this.addEventListener('click', this._handleClick);
}
```

`firstUpdated` fires after the first time your component has been updated and called its `render` method, but **before the browser has had a chance to paint**. The `Promise`/`setTimeout` line yields to the browser
    
See [firstUpdated](/guide/lifecycle#firstupdated) in the Lifecycle documentation for more information.


## Using `this` in event listeners

Event listeners added using the declarative (`@event`) syntax in the template are automatically _bound_ to the component.

Therefore, you can use `this` to refer to your component instance inside any declarative event handler:

```js
class MyElement extends LitElement {
  render() {
    return html`<button @click="${this._handleClick}">click</button>`;
  }
  _handleClick(e) {
    console.log(this.prop);
  }
}
```

When adding listeners imperatively with `addEventListener`, you'll need to bind the event listener yourself if you need a reference to the component instance. For example:

```js
this.boundResizeHandler = this.handleResize.bind(this);
window.addEventListener('resize', this.boundResizeHandler);
```

Or use an arrow function as a class field:

```ts
export class MyElement extends LitElement {
  private _handleResize = () => { /* handle the event */ }

  constructor() {
    window.addEventListener('resize', this._handleResize);
  }
}
```

See the [documentation for `this` on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) for more information.

## Setting event listener options

When you add an event listener imperatively, using `addEventListener`, you can specify various event listener options. For example, to use a passive event listener in plain JavaScript you'd do something like this:

```js
someElement.addEventListener('touchstart', this._handleTouchStart, {passive: true});
```

The `eventOptions` decorator allows you to add event listener options to a listener that's added declaratively in your template.

```js
import {LitElement, html, eventOptions} from 'lit-element';
...

@eventOptions({passive: true})
private _handleTouchStart() { ... }

render() { 
  return html`
    <div @touchstart=${this._handleTouchStart}><div>
  `;
}
```

<div class="alert alert-info">

**Using decorators.** Decorators are a proposed JavaScript feature, so you’ll need to use a compiler like Babel or TypeScript to use decorators. See [Using decorators](decorators) for details.

</div>

The object passed to `eventOptions` is used as the `options` parameter to `addEventListener`.



More information:

*   [EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) on MDN for a description of the event listener options.


## Use cases

* [Fire a custom event from a LitElement-based component](#fire-custom-event).
* [Handle a custom event fired by a LitElement-based component](#handle-custom-event).
* [Handle an event fired by a shadow DOM child of your component](#handle-shadow-dom-event).
* [Add event listeners imperatively](#imperative).

### Fire an event from a LitElement-based component {#fire-event}

Fire a custom event:

```js
class MyElement extends LitElement {
  render() {
    return html`<div>Hello World</div>`;
  }
  firstUpdated(changedProperties) {
    let event = new CustomEvent('my-event', {
      detail: {
        message: 'Something important happened'
      }
    });
    this.dispatchEvent(event);
  }
}
```

Fire a standard event:

```js
class MyElement extends LitElement {
  render() {
    return html`<div>Hello World</div>`;
  }
  updated(changedProperties) {
    let click = new Event('click');
    this.dispatchEvent(click);
  }
}
```

### Handle an event fired by a LitElement-based component {#handle-fired-event}

If you want to listen to an event fired from a LitElement-based component from within another LitElement or from a lit-html template, you can use the lit-html declarative event syntax:

```html
<my-element @my-event="${(e) => { console.log(e.detail.message) }}"></my-element>
```

To listen to events fired from a LitElement-based component in other contexts, like HTML or another framework, use the standard mechanism for listening to DOM events.

In plain HTML and JavaScript, this would be the `addEventListener` API:

```js
const myElement = document.querySelector('my-element');
myElement.addEventListener('my-event', (e) => {console.log(e)});
```

## Working with events and shadow DOM

When working with events and shadow DOM, there are a few things you need to know about. 

### Event bubbling

Some events bubble up through the DOM tree, so that they are detectable by any element on the page. 

Whether or not an event bubbles depends on the value of its `bubbles` property. To check if a particular event bubbles:

```js
handleEvent(e){
  console.log(e.bubbles);
}
```

See the MDN documentation on the [Event interface](https://developer.mozilla.org/en-US/docs/Web/API/Event) for more information.

### Event retargeting

Bubbling events fired from within shadow DOM are retargeted so that, to any listener external to your component, they appear to come from your component itself. 

**Example**

```html
<my-element onClick="(e) => console.log(e.target)"></my-element>
```

```js
render() {
  return html`
    <button id="mybutton" @click="${(e) => console.log(e.target)}">
      click me
    </button>`;
}
```

When handling such an event, you can find where it originated from with `composedPath`:

```js
handleMyEvent(event) {
  console.log('Origin: ', event.composedPath()[0]);
}
```

### Custom events

By default, a bubbling custom event fired inside shadow DOM will stop bubbling when it reaches the shadow root. 

To make a custom event pass through shadow DOM boundaries, you must set both the `composed` and `bubbles` flags to `true`:

```js
firstUpdated(changedProperties) {
  let myEvent = new CustomEvent('my-event', { 
    detail: { message: 'my-event happened.' },
    bubbles: true, 
    composed: true });
  this.dispatchEvent(myEvent);
}
```

See the [MDN documentation on custom events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) for more information.
