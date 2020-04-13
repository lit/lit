---
layout: page.11ty.cjs
title: <my-element> ⌲ Home
---

# &lt;my-element>

`<my-element>` is an awesome element. It's a great introduction to building web components with LitElement, with nice documentation site as well.

## As easy as HTML

<section class="columns">
  <div>

`<my-element>` is just an HTML element. You can it anywhere you can use HTML!

```html
<my-element></my-element>
```

  </div>
  <div>

<my-element></my-element>

  </div>
</section>

## Configure with attributes

<section class="columns">
  <div>

`<my-element>` can be configured with attributed in plain HTML.

```html
<my-element name="HTML"></my-element>
```

  </div>
  <div>

<my-element name="HTML"></my-element>

  </div>
</section>

## Declarative rendering

<section class="columns">
  <div>

`<my-element>` can be used with declarative rendering libraries like Angular, React, Vue, and lit-html

```js
import {html, render} from 'lit-html';

const name="lit-html";

render(html`
  <h2>This is a &lt;my-element&gt;</h2>
  <my-element .name=${name}></my-element>
`, document.body);
```

  </div>
  <div>

<h2>This is a &lt;my-element&gt;</h2>
<my-element name="lit-html"></my-element>

  </div>
</section>
