---
layout: default
---
<header class="hero">
{% include topnav.html %}
<div class="wrapper">
<h1 class="hero-title">{{ site.name }}</h1>
<p class="hero-caption">{{ site.description }}</p>
<a class="hero-link" href="{{ site.baseurl }}/guide">Get Started</a>
</div>
</header>

<section>
<div class="wrapper">

## Next-generation HTML Templates in JavaScript

lit-html lets you write HTML templates in JavaScript, then efficiently render and _re-render_ those templates together with data to create and update DOM:

```js
import {html, render} from 'lit-html';

// A lit-html template uses the `html` template tag:
let sayHello = (name) => html`<h1>Hello ${name}</h1>`;

// It's rendered with the `render()` function:
render(sayHello('World'), document.body);

// And re-renders only update the data that changed, without
// VDOM diffing!
render(sayHello('Everyone'), document.body);
```

</div>
</section>

<section class="grey-bg">
<div class="wrapper">

## Why use lit-html?

<div class="responsive-row">
<div style="flex: 1">

### Efficient

lit-html is extremely fast. It uses fast platform features like HTML `<template>` elements with native cloning.

Unlike VDOM libraries, lit-html only ever updates the parts of templates that actually change - it doesn't re-render the entire view.

</div>
<div style="flex: 1">

### Expressive

lit-html gives you the full power of JavaScript and functional programming patterns. 

Templates are values that can be computed, passed to and from functions and nested. Expressions are real JavaScript and can include anything you need at all.

lit-html support many kind of values natively: strings, DOM nodes, heterogeneous lists, Promises, nested templates and more.

</div>
<div style="flex: 1">

### Extensible

lit-html is extremely customizable and extensible.

Different dialects of templates can be created with additional features for setting element properties, declarative event handlers and more.

Directives customize how values are handled, allowing for asynchronous values, efficient keyed-repeats, error boundaries, and more. lit-html is like your very own a template construction kit.

</div>
</div>
</div>
</section>

<section>
<div class="wrapper">
<div class="responsive-row center">
<div style="max-width: 600px">

lit-html is not a framework, nor does it include a component model. It focuses on one thing and one thing only: efficiently creating and updating DOM. It can be used standalone for simple tasks, or combined with a framework or component model, like Web Components, for a full-featured UI development platform.

## Announcement at Polymer Summit 2017

<iframe src="https://www.youtube.com/embed/ruql541T7gc"
    style="width: 560px; height: 315px; max-width: 100%; border: none"
    allow="autoplay; encrypted-media" allowfullscreen></iframe>

</div>
</div>
</div>
</section>
