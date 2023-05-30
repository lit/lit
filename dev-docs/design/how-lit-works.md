# How Lit Works

## About this Document

This is a deep-dive into how lit-html works, what makes it fast, how the code is organized, and what could be improved. It's intended for contributors, web platform engineers, security reviewers, technical decision-makers, authors of similar libraries, or anyone who is very interested in the inner workings of the library.

The source code itself is generally optimized to be read and we try to be as clear and self-documenting as possible, erring on the side of verbosity, with numerous comments when needed to explain why code is written as it is. We expect the source to be optimized by tools, so we can keep it understandable by humans.

This document provides both high-level overview and additional detail. If anything is unclear or you have questions, please open an issue and we'll do our best to clarify either the source or this document.

# What is lit-html?

lit-html is an HTML templating library. Templates are written in JavaScript by mixing static HTML strings and dynamic JavaScript values using template literals. lit-html enables a functional / UI-as-data programming model, fast initial rendering, and fast updates that minimally update DOM when state changes.

The key that enables this is separating static parts of templates from the dynamic parts with template literals, and never traversing or updating the static parts after the initial render.

## Comparison to Virtual DOM

lit-html is comparable in many ways to virtual-DOM approaches, but it works without storing a separate representation of the DOM in memory, or computing DOM diffs like virtual-DOM libraries must do.

- Where VDOMs work at the level of the DOM representation of a UI, lit-html works at the _value_ level.
- lit-html UIs are values, like VDOM, but instead of each DOM node being represented as a single value, the DOM structure is represented by a reference to a template.
- The tree of values that's used to create DOM is more sparse than the associated DOM tree, so traversing it when necessary is faster.
- lit-html doesn't need to track

# Foundational Pieces

lit-html relies on two key platform features for its performance and ergonomics: JavaScript Tagged Template Literals and the HTML `<template>` Element.

## JavaScript Tagged Template Literals

lit-html's rendering process starts with defining a template with a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates).

Far from just string interpolation, a _tagged_ template literal is essentially a function call that passes the strings literals and the values of expressions to the tag function.

This code:

```js
let tag = (strings, ...values) => {
  console.log('strings: ', strings);
  console.log('values: ', values);
};
let text = 'abc';
tag`<div>${text}</div>`;
```

prints:

```bash
strings: ["<div>", "</div>", raw: Array(2)]
values: ["abc"]
```

A tag function can return any object, it does not have to return a string.

The first argument to the tag is a special array of strings. It retains its identity across multiple evaluations of the tagged literal. We can see this if we put the tagged literal in a function:

```js
// Store how many times we've seen each literal
let counts = new Map();

// A template tag that updates the count storage and longs the count
let count = (strings) => {
  // The strings object is our Map key
  let c = (counts.get(strings) || 0) + 1;
  counts.set(strings, c);
  console.log(`literal ${strings.join('')} seen ${c} time(s)`);
};

// Two functions that evaluate to different tagged literals
let f = (text) => count`abc`;
let g = (text) => count`def`;

f();
f();
g();
```

Prints:

```bash
literal abc seen 1 time(s)
literal abc seen 2 time(s)
literal def seen 1 time(s)
```

So the strings argument can be used as a cache key. lit-html uses this to do template preparation work only the first time it renders a template anywhere in the page.

## The HTML `<template>` Element

The [`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) is a container for _inert_ HTML content. Its contents are parsed, but not rendered: scripts don't run, styles don't apply, Custom Elements don't upgrade, etc.

During parsing, or when setting `innerHTML`, nodes that would normally become children in other elements, are moved into the template's _content_ fragment: a `DocumentFragment` accessible via the `.content` property. A template's contents can be cloned or imported into a Document, which makes the cloned nodes active.

# Rendering

lit-html templates are only a description of the UI. They must be rendered to affect the DOM. While there are a few internal phases to rendering, to the author there appear to be only two: define and render.

Template are most often written as functions that return a lit-html `TemplateResult`:

```js
let f = (state) => html`<h1>${state.title}</h1>`;
```

They are then invoked to obtain a description of the UI with a particular state:

```js
let ui = f(state);
```

Then rendered to a specific container:

```js
render(ui, container);
```

`render()` can be called multiple times with results of the same template, but different state, and the DOM will be updated to match the state. From the author's point of view there's little difference between an initial render and an update.

# Phases of Template Rendering

Templates go through distinct phases when rendering. Some of the work for rendering happens the first time a template is rendered anywhere on a page, some the first time a template is rendered to a particular container, and some when a template instance is updated with new data.

## 1. Define

Templates are defined with the `html` template tag. This tag does very little work - it only captures the current values and a reference to the strings object, and returns this as a `TemplateResult.

lit-html syntax is configurable via `TemplateProcessor`s. The specifics of using a `.`, `@`, and `?` prefixes for attribute names to denote property, event and boolean attribute bindings is only how the default `TemplateProcessor` works. It's important that the syntax of a template is fixed at definition time so that its meaning and behavior doesn't change if it's rendered by a different library. That is - it's the template _author_ who needs to control the syntax, not the code that renders.

So, `TemplateResult` also contains a reference to the `TemplateProcessor` to be used.

lit-html ships with two template tags: `html` and `svg`. The `svg` tag is for defining SVG _fragment_ templates: it ensures that the elements created are in the SVG namespace.

The default `html` and `svg` tags are extremely simple, just:

```ts
export const html = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new TemplateResult(strings, values, 'html', defaultTemplateProcessor);
```

And the `TemplateResult` constructor is also very simple:

```ts
  constructor(
      strings: TemplateStringsArray, values: unknown[], type: string,
      processor: TemplateProcessor) {
    this.strings = strings;
    this.values = values;
    this.type = type;
    this.processor = processor;
  }
```

This means that evaluating a template expression can be _extremely_ fast. It's only as expensive as the JavaScript expressions in the template, two function calls and an object allocation.

## 2. Prepare

When a template is rendered for the very first time on a page, it must be prepared. Preparation creates a `<template>` element that be cloned to create new instances, and metadata about the expressions in a template so that updatable Parts can be created for the instance.

### 2.1. Join the template's string literals with a marker string.

This is like a string interpolation that disregards the values of the expressions. For each expression, lit-html does some backtracking on the preceding string literal to determine if the expression is in a text position (ie, `<p>${}</p>`) or an attribute position (ie, `<p class=${}</p>`). This marker is a comment node (`<!--{{lit-$random}}-->`) for text positions, and a sentinel string (`{{lit-$random}}`) for attribute positions.

For attributes with expressions, we append a suffix to the attribute name. This is so that special-cased attributes like `style` and `class` and many SVG attributes aren't handled by the browser at a point when they contain marker expressions. (IE and Edge parse the `style` attribute value and discard it if it's invalid CSS for instance).

The template: `<p class=${c}>${text}</p>` is transformed into the HTML string: `<p class={{-lit-}}><!-- lit --></p>`.

Generating the HTML is currently the responsibility of `TemplateResult`, mostly because it must be slightly customized for SVG. `SVGTemplateResult` wraps the template content in an `<svg>` tag so that when cloned the contents are in the SVG namespace.

### 2.2. Create a `<template>` element

The HTML string from step 2.1 is simply used to set the `innerHTML` of a new `<template>` element. This causes the browser to parse the template HTML. Text-position markers that were written as comments are parsed into comment nodes.

Because this step does not use any provided values (and because templates are inert), this step is safe from XSS vulnerabilities or other malicious input.

### 2.3. Create a lit-html `Template` object

The `Template` class does most of the heavy-lifting for preparing a template. It walks the tree of nodes in a `<template>` element finding the markers inserted in step 2.1. If a marker is found, either in an attribute, as a marker comment node, or in text content, the depth-first index of the node is recorded, along with the type of expression (`'text'` or `'attribute'`) and the name of the attribute.

`Template` has to do different work for specific Node types:

#### Element

Each attribute must be checked for the presence of an expression marker.

When we find an attribute that has a expression marker, we remove the attribute and create the expression metadata object that records its location and name.

#### Text

Usually text-position markers will be comment nodes, but inside `<style>` and `<script>` tags the markup that _looks_ like a comment (`<!-- lit -->`) will just be inserted as _text_ in the script or style. So we must search for the marker as text. If found we split the Text node and insert a comment marker.

_Note: We could possibly do better here. See: https://github.com/Polymer/lit-html/issues/755_

#### Comment

Comment usually either an expression marker, or a user-written comment with no expression associated with them. Occasionally though a user may have written an expression inside a comment. This is especially easy to do with IDEs that help comment out code sections and are inline-html aware. We might see a comment like `<!--<div>${text}</div>-->` in the template text, so we must scan comments for marker text.

## 3. Create

The create phase is performed when rendering for the the first time to a specific container or Part.

_TODO: better homes for these notes_

<blockquote>
Note: A template can be rendered to a container (with `render(result, container)`) or a Part. Templates are rendered to Parts by being used as a value within another template.

In this example:

```js
let postBodyTemplate = (text) => html`<p>${text}</p>`;
let postTemplate = (post) => html`
  <h1>${post.title}</h1>
  ${postBodyTemplate(post.body)}
`;
```

The `TemplateResult` returned from `postBodyTemplate(post.body)` is rendered to the `NodePart` defined by the expression markers.

</blockquote>

<blockquote>
Note: When a `TemplateResult` is rendered to a container or Part we get its `Template` via a template factory function that's passed to `render()` via the options argument. A template factory is responsible for creating and caching `Template` objects.

This abstraction is necessary because certain extensions to lit-html may need to modify templates or cache based on additional keys. The included `shady-render.js` library uses `ShadyCSS` (part of the Shadow DOM polyfills) to modify templates for CSS scoping, and caches templates based on their scope identifier in addition to their template strings.

The template factory is what initiates the Prepare step if a `Template` is not yet in the cache.

</blockquote>

### 3.1 Create a `TemplateInstance`

`TemplateInstance` is that class that is responsible for most of the create and update steps. It's given a `Template`, `TemplateProcessor`, and `RenderOptions`.

### 3.1 Clone the template

The `<template>` element is cloned by `TemplateInstance#_clone()`.

Care must be taken to manage cloning and upgrade order. We need the cloned DOM to exactly match the template DOM so that we can find Part locations when we walk the cloned tree. When Custom Elements upgrade, it's possible that they could modify the DOM before we get a chance to walk it, throwing off our part indices.

In general, Custom Elements are barred from modifying their own DOM, and we don't need to worry about their ShadowRoots, except in the case of the Web Components polyfills. So with native Web Components, template contents are cloned with `document.importNode()`, which will cause Custom Elements to upgrade. With polyfilled Web Components, template contents are cloned with `template.content.cloneNode()`, which will not upgrade elements. They are then upgraded later.

### 3.2 Create Parts

After cloning, `TemplateInstance#_clone()` walks the cloned contents so that we can associate nodes with expression metadata by depth-first-index. When we get to a node that has an associated expression we call the `TemplateProcessor` function with the node and expression metadata to create a Part. The `TemplateProcessor` will return either a `NodePart`, `AttributePart`, `PropertyPart`, `EventPart` or `BooleanAttributePart` based on expression position and/or attribute name.

When we encounter `<template>` nodes in the tree, we recurse into their content fragments to find any other expressions and create their Parts.

## 4. Update

The update step, which is performed for initial renders as well, is performed in `TemplateInstance#update()`.

Updates are performed in two phases: setting values, and commit. `update()` simply iterates through each part and value (the parts array and values array are always the same length) and calls `part.setvalue(v)` for each part. Then it iterates though the parts again and calls `part.commit()`.

This two-phase design lets attributes and properties that have multiple parts associated with them be committed only once.

The heavy-lifting of the update phase is done by the parts themselves, in `setValue()` and `commit()`, and in `AttributeCommitter` and `PropertyCommitter`.

_TODO: finish update section_

### Parts

#### NodePart

TODO:

- describe handling of different value types
- performance optimizations for text
- dirty checking primitives
- nesting parts
- sharing start/end markers

#### AttributePart & AttributeCommitter

#### PropertyPart & PropertyCommitter

#### EventPart

TODO:

- event content
- adding the part as the handler for performance
- can we improving debugging in devtools?

#### BooleanAttributePart

### Directives

TODO:

- branding directive
- thunking behavior of directives
- why directive are called in commit()
- storing state
- modifying dom
- document important directives
  - repeat
  - cache
  - until
  - unsafeHTML
  - ifDefined
