# lit-html
HTML template literals in JavaScript

`lit-html` lets you describe HTML templates with JavaScript template literals, and efficiently apply those templates to existing DOM.

## Example

```javascript
const sayHello = (name) => html`<div>Hello ${name}!</div>`;

const container = document.querySelector('#container');
sayHello('Steve').renderTo(container);
// renders <div>Hello Steve!</div> to container

sayHello('Kevin').renderTo(container);
// updates to <div>Hello Kevin!</div>, but only updates the ${name} part
```

## How it Works

`html` does not return DOM nodes, like many other HTML with tagged template literal examples, but returns a `TemplateResult` - an object that contains a template and the values from expressions in the template.

The template is created only the first time `html` is called on a particular template literal. On every subsequent call of `html` on the same template literal the exact same template is returned, only the values change.

To call `html` multiple times on the same template literal, it'll usually be placed in a function:

```javascript
let count = 1;
const render = () => html`count: ${count++}`;
```

The template object is based on an actual HTML `<template>` element and created by setting it's `innerHTML`, utilizing the browsers HTML parser. The HTML is not created by concatenating the expression values, but by adding in special markers. The template object finds and remembers the locations of the markers (called "parts"). This makes the system safer from XSS attacks: a value bound to an attribute can't close the attribute, text content is automatically escaped, etc.

When a template is rendered it is cloned along with the part metadata. Values are set via `setAttribute()` and `textContent`. Some state is stored on the container to indicate that a template was already rendered there. Subsequent renders use that state to update only the parts, not the entire template instance.

## Use in Components

HTML template coule easily be the basis for component rendering, similar to JSX in React. A component base class can call an instance method that returns a `TemplateResult` and then apply it to the shadow root:

```javascript
class MyElement extends CoolBaseElement {

  static get observedProperties() {
    return ['message', 'name'];
  }

  title = `About lit-html`;
  body = `It's got potential.`;

  render() { return html`
    <h1>${title}</h1>
    <p>${body}</p>
  `;}
}
```

## Features

### Simple expressions and literals

Anything coercible to strings are supported:

```javascript
const render = () => html`foo = ${foo}`;
```

### Functions/Thunks

A function value is called with no arguments, in a try/catch block to be safe from exceptions:

```javascript
let data;
const render = () => html`foo = ${_=>data.foo}`;
```

Here, `data.foo` throws because `data` is undefined, but the rest of the template renders.

Thunks are trampolined so they can return other thunks.

### Arrays/Iterables

```javascript
const items = [1, 2, 3];
const render = () => html`items = ${items.map((i) => `item: ${i})}`;
```

```javascript
const items = {
  a: 1,
  b: 23,
  c: 456,
};
const render = () => html`items = ${Object.entries(items)}`;
```

### Nested Templates

```javascript
const header = html`<h1>${title}</h1>`;
const render = () => html`
  ${header}
  <p>And the body</p>
`;
```

These features compose so you can include iterables of thunks that return arrays of nested templates, etc...

## Future Work

### Stateful Values

In order to support stateful repeat/if like `dom-repeat` and `dom-if` a value should be able to control it's rendering somewhat. TBD.

### Layering

`lit-html` doesn't support declarative event handlers or property setting. A layer on top should be able to add that while exposing the same API.

### Async Support

Promises and Async Iterables should be supported natively.
