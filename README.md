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

`html` does not return DOM nodes, unlike many other HTML with tagged template literal examples, but returns a `TemplateResult` - an object that contains a template and the values from expressions in the template.

The template is created only the first time `html` is called on a particular template literal. On every subsequent call of `html` on the same template literal the exact same template is returned, only the values change.

To call `html` multiple times on the same template literal, it'll usually be placed in a function:

```javascript
let count = 1;
const render = () => html`count: ${count++}`;
```

The template object is based on an actual HTML `<template>` element and created by setting it's `innerHTML`, utilizing the browsers HTML parser. The HTML is not created by concatenating the expression values, but by adding in special markers. The template object finds and remembers the locations of the markers (called "parts"). This makes the system safer from XSS attacks: a value bound to an attribute can't close the attribute, text content is automatically escaped, etc.

When a template is rendered it is cloned along with the part metadata. Values are set via `setAttribute()` and `textContent`. Some state is stored on the container to indicate that a template was already rendered there. Subsequent renders use that state to update only the parts, not the entire template instance.

### Rough Algorithm

#### `html`:

1. `html` is invoked with `strings` and `values`.

    `strings` are the literal parts as a `TemplateStringsArray`. The same instance is returned for every evaluation of a template literal.

2. Look up a cached template keyed by `strings`, otherwise

3. Create a new template:

     1. Join `strings` with a special marker, `{{}}`. This creates a template string that looks like a Polymer template with empty expressions.

     2. Create a new `<template>` element and set it's `innerHTML` to the tempalte string.

     3. Crawl the `<template>` looking for expressions and remember their location by index in `Part` objects. Text-content expressions create new empty text nodes which are used as placeholders.

6. Return a `TemplateResult` with the template and the values.

#### `TemplateResult.renderTo(container)`:

1. Look for an existing `TemplateInstance` on `container`

2. If an instance exists, check that it's from the same `Template` as this `TemplateResult`

3. If the instance from the same `Template`, remove it's content from `container`

4. If an instance doesn't exist, create on from the `Template`:

    1. Clone the `Template`'s `<template>` contents.

    2. Iterate through the cloned nodes and create new "instance parts" for nodes that have `Part`s. An "instance part" is just a {part, node} record.

5. Update. For every `Part`:

    1.  If it's an attribute part, build up an attibute value then set the attribute.
    
    2. If it's a node part, get the value (trampoline thunks, render nested templates, etc), then either append a document fragment or set the `textContent`.

6. If this is the first render, append the result DOM to `container`.

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
    <h1>${this.title}</h1>
    <p>${this.body}</p>
  `;}
}
```

## Benefits over HTML templates

`lit-html` has basically all of the benefits of HTML-in-JS systems like JSX.

### Lighter weight

There's no need to load expression parser and evaluator.

### Seamless access to data

Since template literals are evaluated in JavaScript, their expressions have access to every variable in that scope, including globals, module and block scopes, and `this` inside methods.

If the main use of templates is to inject values into HTML, this breaks down a major barrier between templates and values.

### Faster expression evaluation

They're just JavaScript expressions

### IDE support by default

In a type-checking environment like TypeScript, expressions are checked because they are just regular script. Hover-over docs and code-completion just work as well.

## Benefits over JSX

### Native syntax

No tooling required. Understood by all JS editors and tools.

### No VDOM overhead

`lit-html` only re-renders the dynamic parts of a template, so it doesn't produce a VDOM tree of the entire template contents, it just produces new values for each expression.

### Scoped

JSX requires that the compiler be configured with the function to compile tags to. You can't mix two different JSX configurations in the same file.

The `html` template tag is just a variable, probably set to a imported function. You can have any number of similar functions in the same JS scope, or set `html` to different implementations.

### Template are values

JSX translates to function calls, can can't be manipulated on a per-template basis at runtime. `lit-html` produces a template object at runtime, which can be further processed by libraries like ShadyCSS.

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
