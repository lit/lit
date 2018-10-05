---
layout: post
title: lit-html
---

## Next-generation HTML Templates in JavaScript

lit-html: An efficient, expressive, extensible HTML templating library for JavaScript.

<div class="hero-buttons">
  <a class="pretty-button" href="/lit-html/guide">Get Started</a>
  <a class="pretty-button" href="https://github.com/Polymer/lit-html">GitHub</a>
</div>

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

## Why use lit-html?

<section class="features">
  <div class="feature">
    <h3>Efficient</h3>
    <p>
      lit-html is extremely fast. It uses fast platform features like HTML <code>&lt;template></code> elements with native cloning.
    </p>
    <p>
      Unlike VDOM libraries, lit-html only ever updates the parts of templates that actually change - it doesn't re-render the entire view.
    </p>
  </div>

  <div class="feature">
    <h3>Expressive</h3>
    <p>
      lit-html gives you the full power of JavaScript and functional programming patterns. 
    </p>
    <p>
      Templates are values that can be computed, passed to and from functions and nested. Expressions are real JavaScript and can include anything you need at all.
    </p>
    <p>
      lit-html support many kind of values natively: strings, DOM nodes, heterogeneous lists, Promises, nested templates and more.
    </p>
  </div>

  <div class="feature">
    <h3>Extensible</h3>
    <p>
      lit-html is extremely customizable and extensible.
    </p>
    <p>
      Different dialects of templates can be created with additional features for setting element properties, declarative event handlers and more.
    </p>
    <p>
      Directives customize how values are handled, allowing for asynchronous values, efficient keyed-repeats, error boundaries, and more. lit-html is like your very own a template construction kit.
    </p>
  </div>
</section>

lit-html is not a framework, nor does it include a component model. It focuses on one thing and one thing only: efficiently creating and updating DOM. It can be used standalone for simple tasks, or combined with a framework or component model, like Web Components, for a full-featured UI development platform.

## Announcement at Polymer Summit 2017

<div class="row">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/ruql541T7gc" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
</div>
