---
layout: example.11ty.cjs
title: <my-element> ⌲ Examples ⌲ Basic
tags: example
name: Basic
description: A basic example
---

<style>
  my-element p {
    border: solid 1px blue;
    padding: 8px;
  }
</style>
<my-element>
  <p>This is child content</p>
</my-element>

<h3>CSS</h3>

```css
p {
  border: solid 1px blue;
  padding: 8px;
}
```

<h3>HTML</h3>

```html
<my-element>
  <p>This is child content</p>
</my-element>
```
