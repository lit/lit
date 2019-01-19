---
layout: post
title: Rendering templates
slug: rendering-templates
---


A lit-html template expression does not cause any DOM to be created or updated. It's only a description of DOM, called a `TemplateResult`. To actually create or update DOM, you need to pass the `TemplateResult` to the `render()` function, along with a container to render to:

```js
import {html, render} from 'lit-html';

const sayHi = (name) => html`<h1>Hello ${name}</h1>`;
render(sayHi('Amy'), document.body);

// subsequent renders will update the DOM
render(sayHi('Zoe'), document.body);
```

## Render Options

The `render` method also takes an `options` argument that allows you to specify:

*   `eventContext`: The `this` value to use when invoking event listeners registered with the `@eventName` syntax.

*   `templateFactory`: The `TemplateFactory` to use. A `TemplateFactory` creates a template element from a `TemplateResult`, typically caching templates based on their static content. Users won't usually supply their own `TemplateFactory`, but libraries that use lit-html may implement custom template factories to customize template handling.

    The `shady-render` module provides its own template factory, which it uses to preprocess templates to integrate with the shadow DOM polyfills (shadyDOM and shadyCSS). 

Render options should *not* change between subsequent `render` calls. 