---
layout: default
---
<header class="hero" markdown="0">
{% include topnav.html %}
<div class="wrapper">
<div class="hero-title">{{ site.name }}</div>
<p class="hero-caption">{{ site.description }}</p>
<a class="hero-link link-with-arrow" href="{{ site.baseurl }}/guide">Get Started</a>
</div>
</header>

<section id="section-snippet">
<div class="wrapper">
<h1 class="title">
Next-generation HTML Templates in JavaScript
</h1>

<div class="responsive-row">

<h3 class="description" style="flex: 1; margin-bottom: 0; max-width: 600px;">

lit-html lets you write HTML templates in JavaScript, then efficiently render and _re-render_ those templates together with data to create and update DOM:

</h3>

<div style="flex: 2">

```js
import {html, render} from 'lit-html';

// A lit-html template uses the `html` template tag:
let sayHello = (name) => html`<h1>Hello ${name}</h1>`;

// It's rendered with the `render()` function:
render(sayHello('World'), document.body);

// And re-renders only update the data that changed, without VDOM diffing!
render(sayHello('Everyone'), document.body);
```

</div>

</div>
</div>
</section>

<section>
<div class="wrapper">

<h1 class="title">
Why use lit-html?
</h1>

<div class="responsive-row">
<div style="flex: 1">

## Efficient

lit-html is extremely fast. It uses fast platform features like HTML `<template>` elements with native cloning.

Unlike VDOM libraries, lit-html only ever updates the parts of templates that actually change - it doesn't re-render the entire view.

</div>
<div style="flex: 1">

## Expressive

lit-html gives you the full power of JavaScript and functional programming patterns.

Templates are values that can be computed, passed to and from functions and nested. Expressions are real JavaScript and can include anything you need.

lit-html supports many kind of values natively: strings, DOM nodes, heterogeneous lists, nested templates and more.

</div>
<div style="flex: 1">

## Extensible

lit-html is extremely customizable and extensible. Directives customize how values are handled, allowing for asynchronous values, efficient keyed-repeats, error boundaries, and more. lit-html is like your very own template construction kit.

</div>
</div>
</div>
</section>

<section>
<div class="wrapper">

<h1 class="title">Efficiently creating and updating DOM</h1>
<h3 style="max-width: 560px">
lit-html is not a framework, nor does it include a component model. It focuses on one thing and one thing only: efficiently creating and updating DOM. It can be used standalone for simple tasks, or combined with a framework or component model, like Web Components, for a full-featured UI development platform.
</h3>

</div>
</section>

<section>
<div class="wrapper">

<h1 class="title">Browser Compatibility</h1>
<h2 class="description">lit-html works in all major browsers (Chrome, Firefox, IE, Edge, Safari, and Opera). </h2>
<div id="browser-thumbnails" style="margin-bottom: 20px;">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/chrome_128x128.png" alt="Chrome logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/firefox_128x128.png" alt="Firefox logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/internet-explorer_128x128.png" alt="Internet Explorer logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/edge_128x128.png" alt="Edge logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/safari_128x128.png" alt="Safari logo">
<img width="56" width="56" src="{{ site.baseurl }}/images/browsers/opera_128x128.png" alt="Opera logo">
</div>

</div>
</section>

<section style="margin-bottom: 40px;">
<div class="wrapper">
<div class="responsive-row">
<div style="max-width: 600px">

<h1 class="title">Announcement at Polymer Summit 2017</h1>

<iframe src="https://www.youtube.com/embed/ruql541T7gc"
    style="width: 560px; height: 315px; max-width: 100%; border: none"
    allow="autoplay; encrypted-media" allowfullscreen></iframe>

</div>
</div>
</div>
</section>
