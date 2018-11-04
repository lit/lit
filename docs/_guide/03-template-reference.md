---
layout: post
title: Template syntax reference
slug: template-reference
---

{::options toc_levels="1..4" /}
* ToC
{:toc}

lit-html templates are written using JavaScript template literals tagged with the `html` tag. The contents of the literal are mostly plain, declarative, HTML:

```js
html`<h1>Hello World</h1>`
```

**Bindings** or expressions are denoted with the standard JavaScript syntax for template literals:

```js
html`<h1>Hello ${name}</h1>`
```

## Template Structure

lit-html templates must be well-formed HTML, and bindings can only occur in certain places. The templates are parsed by the browser's built-in HTML parser before any values are interpolated. 

**No warnings.** Most cases of malformed templates are not detectable by lit-html, so you won't see any warnings—just templates that don't behave as you expect—so take extra care to structure templates properly. {.alert-warning}

Follow these rules for well-formed templates:

 *  Templates must be well-formed HTML when all expressions are replaced by empty values.

 *  Bindings **_can only occur_** in attribute-value and text-content positions.

    ```html
`   <!-- attribute value --> \
    <div label="${label}"></div>

    <!-- text content -->
    <div>${textContent}</div>
    ```


 *  Expressions **_cannot_** appear where tag or attribute names would appear.
    
    ```html
    <!-- ERROR --> 
    <${tagName}></${tagName}> 

    <!-- ERROR --> 
    <div ${attrName}=true></div>
    ```


 *  Templates can have multiple top-level elements and text.

 *  Templates **_should not contain_** unclosed elements—they will be closed by the HTML parser.

    ```js
    // HTML parser closes this div after "Some text"
    const template1 = html`<div class="broken-div">Some text`;
    // When joined, "more text" does not end up in .broken-div
    const template2 = html`${template1} more text. </div>`;
    ```

## Binding Types

Expressions can occur in text content or in attribute value positions.

There are a few types of bindings:

  * Text:

    ```js
    html`<h1>Hello ${name}</h1>`
    ```

    Text bindings can occur anywhere in the text content of an element.

  * Attribute:

    ```js
    html`<div id=${id}></div`
    ```

  * Boolean Attribute:

    ```js
    html`<input type="checkbox" ?checked=${checked}>`
    ```

  * Property:

    ```js
    html`<input .value=${value}>`
    ```

  * Event Listener:

    ```js
    html`<button @click=${(e) => console.log('clicked')}>Click Me</button>`
    ```

### Event Listeners

Event listeners can be functions or objects with a `handleEvent` method. Listeners are passed as both the listener and options arguments to `addEventListener`/`removeEventListener`, so that the listener can carry event listener options like `capture`, `passive`, and `once`.

```js
const listener = {
  handleEvent(e) {
    console.log('clicked');
  }
  capture: true;
};

html`<button @click=${listener}>Click Me</button>`
```

## Supported Data Types

Each binding type supports different types of values:

 * Text content bindings: Many supported types—see below.

 * Attribute bindings: All values are converted to strings.

 * Boolean attribute bindings: All values evaluated for truthiness.

 * Property bindings: Any type of value.

 * Event handler bindings: Event handler functions or objects only.

### Supported data types for text bindings

Text content bindings accept a large range of value types:

*   Primitive values.
*   TemplateResult objects.
*   DOM nodes.
*   Arrays or iterables.

#### Primitive Values: String, Number, Boolean, null, undefined

Primitives values are converted to strings when interpolated into text content or attribute values. They are checked for equality to the previous value so that the DOM is not updated if the value hasn't changed.

#### TemplateResult

Templates can be nested by passing a `TemplateResult` as a value of an expression:

```js
const header = html`<h1>Header</h1>`;

const page = html`
  ${header}
  <p>This is some text</p>
`;
```

#### Node

Any DOM Node can be passed to a text position expression. The node is attached to the DOM tree at that point, and so removed from any current parent:

```js
const div = document.createElement('div');
const page = html`
  ${div}
  <p>This is some text</p>
`;
```

#### Arrays / Iterables

Arrays and Iterables of supported types are supported as well. They can be mixed values of different supported types.

```javascript
const items = [1, 2, 3];
const list = () => html`items = ${items.map((i) => `item: ${i}`)}`;
```

```javascript
const items = {
  a: 1,
  b: 23,
  c: 456,
};
const list = () => html`items = ${Object.entries(items)}`;
```

## Control Flow with JavaScript

lit-html has no built-in control-flow constructs. Instead you use normal JavaScript expressions and statements:

### Ifs with ternary operators

Ternary expressions are a great way to add inline-conditionals:

```js
html`
  ${user.isloggedIn
      ? html`Welcome ${user.name}`
      : html`Please log in`
  }
`;
```

### Ifs with if-statements

You can express conditional logic with if statements outside of a template to compute values to use inside of the template:

```js
getUserMessage() {
  if (user.isloggedIn) {
    return html`Welcome ${user.name}`;
  } else {
    return html`Please log in`;
  }
}

html`
  ${getUserMessage()}
`
```

### Loops with Array.map

To render lists, `Array.map` can be used to transform a list of data into a list of templates:

```js
html`
  <ul>
    ${items.map((i) => html`<li>${i}</li>`)}
  </ul>
`;
```

### Looping statements

```js
const itemTemplates = [];
for (const i of items) {
  itemTemplates.push(html`<li>${i}</li>`);
}

html`
  <ul>
    ${itemTemplates}
  </ul>
`;
```

## Built-in directives

Directives are functions that can extend lit-html by customizing the way a binding renders.

lit-html includes a few built-in directives:

*   when. A directive for conditional templates.
*   repeat. Generates a series of values (usually templates) from an array or iterable.
*   <<<etc.>>>

### `when(condition, trueTemplate, falseTemplate)`

Efficiently switches between two templates based on the given condition. The rendered content is cached, and re-used when switching conditions. Templates are evaluated lazily, so the passed values must be functions.

Example:

```js
import { when } from 'lit-html/directives/when';

let checked = false;
html`
  ${when(checked, () => html`Checkmark is checked`, 
         () => html`Checkmark is not checked`)}
`;
```

### `repeat(items, keyfn, template)`

Repeats a series of values (usually `TemplateResults`) generated from an
iterable, and updates those items efficiently when the iterable changes. When
the `keyFn` is provided, key-to-DOM association is maintained between updates by
moving DOM when required, and is generally the most efficient way to use
`repeat` since it performs minimum unnecessary work for insertions amd removals.

Example:

```js
import { repeat } from 'lit-html/directives/repeat';

const myTemplate = () => html`
  <ul>
    ${repeat(items, (i) => i.id, (i, index) => html`
      <li>${index}: ${i.name}</li>`)}
  </ul>
`;
```

If no `keyFn` is provided, `repeat` will perform similar to a simple map of
items to values, and DOM will be reused against potentially different items.

### `ifDefined(value)`

For AttributeParts, sets the attribute if the value is defined and removes the attribute if the value is undefined.

For other part types, this directive is a no-op.

Example:

```javascript
import { ifDefined } from 'lit-html/directives/if-defined';

const myTemplate = () => html`
  <div class=${ifDefined(className)}></div>
`;

```

### `guard(expression, valueFn)`

Prevents any re-render until the identity of the expression changes, for example when a primitive changes value or when an object reference changes.

Example:

```js
import { guard } from 'lit-html/directives/guard';

const template = html`
  <div>
    ${guard(items, () => items.map(item => html`${item}`))}
  </div>
`
```

In this case, items are mapped over only when the array reference changes.

### `until(promise, defaultContent)`

Renders `defaultContent` until `promise` resolves, then it renders the resolved value of `promise`.

Example:

```javascript
import { until } from 'lit-html/directives/until';

const render = () => html`
  <p>
    ${until(
        fetch('content.txt').then((r) => r.text()),
        html`<span>Loading...</span>`)}
  </p>
`;
```

### `asyncAppend(asyncIterable)` and `asyncReplace(asyncIterable)`

JavaScript asynchronous iterators provide a generic interface for asynchronous sequential access to data. Much like an iterator, a consumer requests the next data item with a a call to `next()`, but with asynchronous iterators `next()` returns a `Promise`, allowing the iterator to provide the item when it's ready.

lit-html offers two directives to consume asynchronous iterators:

 * `asyncAppend` renders the values of an [async iterable](https://github.com/tc39/proposal-async-iteration),

appending each new value after the previous.

 * `asyncReplace` renders the values of an [async iterable](https://github.com/tc39/proposal-async-iteration),

replacing the previous value with the new value.

Example:

```javascript
const wait = (t) => new Promise((resolve) => setTimeout(resolve, t));
/**
 * Returns an async iterable that yields increasing integers.
 */
async function* countUp() {
  let i = 0;
  while (true) {
    yield i++;
    await wait(1000);
  }
}

render(html`
  Count: <span>${asyncReplace(countUp())}</span>.
`, document.body);
```

In the near future, `ReadableStream`s will be async iterables, enabling streaming `fetch()` directly into a template:

```javascript
// Endpoint that returns a billion digits of PI, streamed.
const url =
    'https://cors-anywhere.herokuapp.com/http://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt';

const streamingResponse = (async () => {
  const response = await fetch(url);
  return response.body.getReader();
})();
render(html`π is: ${asyncAppend(streamingResponse)}`, document.body);
```