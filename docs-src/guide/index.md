---
title: Introduction
---

# What is lit-html?

lit-html is a simple, modern, safe, small and fast HTML templating library for JavaScript.

lit-html lets you write HTML templates in JavaScript using [template literals] with embedded expressions, then efficiently render, and _re-render_ those templates together with data to create DOM.

lit-html is not a framework, nor does it include a component model. If focuses on one thing and one thing only: creating and updating DOM. It can be used standalone for simple tasks, or combined with a framework or component model, like Web Components, for a full-featured UI development platform.

# lit-html Templates

lit-html templates are tagged template literals - they look like JavaScript strings but are enclosed in backticks (`` ` ``) instead of quotes - tagged with lit-html's `html` tag.

```js
html`<h1>Hello ${name}</h1>`
```


[template literals]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
