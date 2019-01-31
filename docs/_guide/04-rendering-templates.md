---
layout: post
title: Rendering templates
slug: rendering-templates
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

A lit-html template expression does not cause any DOM to be created or updated. It's only a description of DOM, called a `TemplateResult`. To actually create or update DOM, you need to pass the `TemplateResult` to the `render()` function, along with a container to render to:

```js
import {html, render} from 'lit-html';

const sayHi = (name) => html`<h1>Hello ${name}</h1>`;
render(sayHi('Amy'), document.body);

// subsequent renders will update the DOM
render(sayHi('Zoe'), document.body);
```

## Render Options

The `render` method also takes an `options` argument that allows you to specify the following options:

*   `eventContext`: The `this` value to use when invoking event listeners registered with the `@eventName` syntax. This option only applies when you specify an event listener as a plain function. If you specify the event listener using an event listener object, the listener object is used as the `this` value. See [Add event listeners](writing-templates#add-event-listeners) for more on event listeners.

*   `templateFactory`: The `TemplateFactory` to use. This is an advanced option. A `TemplateFactory` creates a template element from a `TemplateResult`, typically caching templates based on their static content. Users won't usually supply their own `TemplateFactory`, but libraries that use lit-html may implement custom template factories to customize template handling.

    The `shady-render` module provides its own template factory, which it uses to preprocess templates to integrate with the shadow DOM polyfills (shadyDOM and shadyCSS). 

For example, if you're creating a component class, you might use render options like this:

```js
class MyComponent extends HTMLElement {
  // ...

  _update() {
    // Bind event listeners to the current instance of MyComponent
    render(this._template(), this._renderRoot, {eventContext: this});
  }
}

```

Render options should *not* change between subsequent `render` calls. 