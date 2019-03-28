---
layout: post
title: Creating directives
slug: creating-directives
---

{::options toc_levels="1..2" /}
* ToC
{:toc}

Directives are functions that can customize how lit-html renders values. Template authors can use directives in their templates like other functions:

```javascript
html`<div>
     ${fancyDirective('some text')}
  </div>`
```

However, instead of _returning_ a value to render, the directive controls what gets rendered to its location in the DOM.

Internally, lit-html uses the [`Part`](/api/classes/lit_html.part.html) interface to represent the dynamic DOM associated with a binding. A directive has access to the `Part` associated with its binding. For example, it can find the current value of the part and set a new value for the part.

To create a directive, pass a factory function to lit-html's `directive` function:

```javascript
const helloDirective = directive(() => (part) => { part.setValue('Hello')});

const helloTemplate = html`<div>${helloDirective()}</div>`
```

The factory function can take optional arguments for configuration and values to be passed in by the template author.

The returned function is called each time the part is rendered. The `part` argument is a `Part` object with an API for directly managing the dynamic DOM associated with expressions. Each type of binding has its own specific Part object: 

*   [`NodePart`](/api/classes/lit_html.nodepart.html) for content bindings.
*   [`AttributePart`](/api/classes/lit_html.attributepart.html) for standard attribute bindings.
*   [`BooleanAttributePart`](/api/classes/lit_html.booleanattributepart.html) for boolean attribute bindings.
*   [`EventPart`](/api/classes/lit_html.eventpart.html) for event bindings.
*   [`PropertyPart`](/api/classes/lit_html.propertypart.html) for property bindings.

Each of these part types implement a common API:

*   `value`. Holds the current value of the part.
*   `setValue`. Sets the pending value of the part.
*   `commit`. Writes the pending value to the DOM. In most cases this happens automatically—this method is only required for advanced use cases, like asynchronous directives. See [Asynchronous directives](#asynchronous-directives) for more information.

Here's an example of a directive that takes a function, and evaluates it in a try/catch block to implement exception-safe expressions:

```javascript
const safe = directive((f) => (part) => {
  try {
    part.setValue(f());
  } catch (e) {
    console.error(e);
  }
});
```

Now the `safe` directive can be used to wrap a function:

```javascript
let data;

// Don't throw an exception if data.foo doesn't exist.
const myTemplate = () => html`foo = ${safe(() => data.foo)}`;
```

This example increments a counter on every render:

```javascript
const renderCounter = directive((initialValue) => (part) =>
  part.setValue(part.value === undefined
     ? initialValue
     :  part.value + 1);
 );
```

The user uses it in a template by passing in an initial value:

```javascript
const myTemplate = () => html`
  <div>
    ${renderCounter(0)}
  </div>`;
```

## Limiting a directive to one binding type

Some directives are only useful in one context, such as an attribute binding or a content binding. If placed in the wrong context, the directive should throw an appropriate error.

This example shows a directive that should only work in a content binding (that is, a `NodePart`).

```javascript 
const myListDirective = directive((items) => (part) => {
  if (!(part instanceof NodePart)) {
    throw new Error('myListDirective can only be used in content bindings');
  }
  // Carry on ...
  ...
```

## Asynchronous directives

Directives are invoked during the render process. The previous example directives are synchronous: they call `setValue` on their parts before returning, so their results are written to the DOM during the render call.

Sometimes, you want a directive to be able to update the DOM asynchronously—for example, if it depends on an asynchronous event like a network request. 

When a directive sets a value asynchronously, it needs to call the part's `commit` method to write the updated value to the DOM.

Here's a trivial example of an asynchronous directive:

```js
const resolvePromise = directive((promise) => (part) => {
  // This first setValue call is synchronous, so 
  // doesn't need the commit
  part.setValue("Waiting for promise to resolve.");

  Promise.resolve(promise).then((resolvedValue) => {
    part.setValue(resolvedValue);
    part.commit();
  });
});
```

Here's an equally trivial example of the directive in use:

```js
const waitForIt = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Promise is resolved.");
  }, 1000);
});

const myTemplate = () => 
   html`<div>${resolvePromise(waitForIt)}</div>`; 
```

Here, the rendered template shows "Waiting for promise to resolve," followed one second later by "Promise is resolved."


## Maintaining state between renders {#maintaining-state}

If your directive needs to maintain state between renders, you can rely on the fact that the `Part` object representing a given location in the DOM stays the same between calls to `render`. In the `renderCounter` example, the part's value serves as the state.

If you need to store more complicated state, you can can use a [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap), using the `Part` as a key.

```js
import {directive} from from 'lit-html';

// Define the map at module level
const stateMap = new WeakMap();

const statefulDirective = directive(() => {(part) => {
  let myState = stateMap.get(part);
  if (myState === undefined) {
    // Initialize state for this location
    myState = {};
    stateMap.set(part, myState);
  }
  // ... use the state somehow
});
```

<div class="alert alert-info">

**Why a WeakMap?** Using a weak map ensures that the `Part` objects and state data can  be garbage collected when they're no longer in use, preventing a memory leak. For more information, see the [MDN page on WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap).

</div>

## Repeating directives in content bindings

Sometimes you want a directive to manage multiple nested parts. For example, a directive that renders a list of items (like `repeat`) might create a nested part for each item. Keeping separate parts lets you manipulate them efficiently: for example, you can change the value of a single part without re-rendering the entire list.

To create nested parts, you construct [`NodePart`](/api/classes/lit_html.nodepart.html) instances and associate them with specific locations in the DOM. The section of DOM controlled by a given `NodePart` needs to be delimited by static nodes that serve as markers. (lit-html usually uses comment nodes for these markers.)

<img alt="Diagram showing a tree of DOM nodes and a NodePart object. The DOM tree consists of a parent node and several child nodes, with two of the child nodes identified as 'marker nodes.' The NodePart object has a startNode property, which points to the first marker node, and an endNode property, which points to the second marker node. Child nodes between the two marker nodes are identified as 'nodes managed by NodePart.'" src="/images/guides/node-part-markers.png" style="max-width: 515px;">

As shown in the diagram, the nodes managed by the `NodePart` appear between its `startNode` and `endNode`. The following code creates and adds a new, nested part inside an existing part (the "container part"). 

```js
import {NodePart} from 'lit-html';
const newPart = new NodePart(containerPart.options);

newPart.appendIntoPart(containerPart);
```

The end result looks something like this:

<img alt="Diagram showing a tree of DOM nodes and a two NodePart objects. The DOM tree consists of a parent node and several child nodes, with two pairs of child nodes identified as 'marker nodes.' The container NodePart object has a startNode property, which points to the first marker node, and an endNode property, which points to the last marker node. The nested NodePart object has startNode and endNode properties that point to the second and third marker nodes. Child nodes between the second and third marker nodes are identified as 'nodes managed by nested NodePart.'" src="/images/guides/nested-node-parts.png" style="max-width: 535px;">

The `appendIntoPart` method creates the marker nodes and inserts the nested part for you. In some cases, you may need to manually manage the marker nodes (for example, if you're inserting a nested part into the middle of the child list). In this case, you can use code like this:


```js
import {NodePart, createMarker} from 'lit-html';

// Create a new part, passing in the render options from the original part
const newPart = new NodePart(containerPart.options);

// Create markers surrounding content managed by the new part
const container = containerPart.startNode.parentNode;
const startNode = createMarker();
container.insertBefore(startNode, containerPart.endNode);
container.insertBefore(createMarker(), containerPart.endNode);

newPart.insertAfterNode(startNode);
```

Putting it all together—the following example directive takes a value and inserts it into the DOM _twice_ by creating two nested parts. As shown in [Maintaining state between renders](#maintaining-state), it uses a `WeakMap` to store these nested parts.

```js
// Import lit-html APIs
import {html, render, directive, NodePart, appendIntoPart} from 'lit-html';

// Stores the nested parts associated with a single instance of the directive
const nestedPartMap = new WeakMap();

// Creates a new nested part and adds it to the DOM
// managed by containerPart
const createAndAppendPart = (containerPart) => {
  const newPart = new NodePart(containerPart.options);
  newPart.appendIntoPart(containerPart);

  return newPart;
}

// duplicate directive takes a single value, and renders it
// in the DOM twice
const duplicate = directive((value) => {

  // the directive function itself
  return (containerPart) => {
    if (!(containerPart instanceof NodePart)) {
      throw new Error('duplicate directive can only be used in content bindings');
    }

    let part1, part2;
    const nestedParts = nestedPartMap.get(containerPart);
    if (nestedParts === undefined) {
      // create parts
      part1 = createAndAppendPart(containerPart);
      part2 = createAndAppendPart(containerPart);
      nestedPartMap.set(containerPart, [part1, part2]);
    } else {
      [part1, part2] = nestedParts;
    }

    // for imperatively created parts, need to call commit()
    // after setValue()
    part1.setValue(value);
    part1.commit();
    part2.setValue(value);
    part2.commit();
  }
});
```

The `NodePart` class provides a number of other convenience methods, including other methods for adding nested parts, and a [`clear`](/api/classes/lit_html.nodepart.html#clear) method to remove all of the DOM associated with a part. See the [NodePart API docs](/api/classes/lit_html.nodepart.html) for details.