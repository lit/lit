---
layout: guide
title: Using decorators
slug: decorators
---

Decorators are special expressions that can alter the behavior of class, class method, and class field declarations. LitElement supplies a set of decorators that reduce the amount of boilerplate code you need to write when defining a component.

For example, the `@customElement` and `@property` decorators make a basic element definition more compact:

```js
import {LitElement, html, customElement, property} from 'lit-element';

@customElement('my-element')
class MyElement extends LitElement {

 // Declare observed properties
 @property()
 adjective = 'awesome';

 // Define the element's template
 render() {
   return html`<p>your ${this.adjective} template here</p>`;
 }
}
```

The `@customElement` decorator defines a custom element, equivalent to calling:

```js
customElements.define('my-element', MyElement);
```

The `@property` decorator declares a reactive property. The lines:

```js
 @property()
 adjective = 'awesome';
```

Are equivalent to:

```js
static get properties() {
  return {
    adjective: {}
  };
}

constructor() {
  this.adjective = awesome;
}
```

## Enabling decorators

To use decorators, you need to use a compiler such as Babel or the TypeScript compiler.

<div class="alert alert-info">

**The decorators proposal**. Decorators are a [stage 2 proposal](https://github.com/tc39/proposal-decorators) for addition to the ECMAScript standard, which means they're neither finalized nor implemented in browsers yet. Compilers like Babel and TypeScript provide support for proposed features like decorators by compiling them into standard JavaScript a browser can run.

</div>

### To use decorators with TypeScript

To use decorators with [TypeScript](https://www.typescriptlang.org/docs/handbook/decorators.html), enable the `experimentalDecorators` compiler option.

```json
"experimentalDecorators": true,
```

Enabling `emitDecoratorMetadata` is not required and not recommended.

### To use decorators with Babel

If you're compiling JavaScript with [Babel](https://babeljs.io/docs/en/), you can enable decorators by adding  the following plugins:

*   [`@babel/plugin-proposal-decorators`](https://babeljs.io/docs/en/babel-plugin-proposal-decorators). 
*   [`@babel/plugin-proposal-class-properties`](https://babeljs.io/docs/en/babel-plugin-proposal-class-properties)

To enable the plugins, you'd add code like this to your Babel configuration:

```js
plugins = [
  '@babel/plugin-proposal-class-properties',
  ['@babel/plugin-proposal-decorators', {decoratorsBeforeExport: true}],
];
```

## LitElement decorators

LitElement provides the following decorators:

*   [`@customElement`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#customelement). Define a custom element.
*   [`@eventOptions`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#eventoptions). Add event listener options for a declarative event listener.
*   [`@property`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#property) and [`internalProperty`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#internalproperty). Define properties.
*   [`@query`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#query), [`queryAll`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#queryAll), and [`queryAsync`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#queryAsync). Create a property getter that returns specific elements from your component's render root.
*   [`@queryAssignedNodes`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#queryAssignedNodes). Create a property getter that returns the children assigned to a specific slot. 


All of the decorators can be imported directly from the <code>lit-element</code> module.

```js
import {eventOptions} from 'lit-element';
```
