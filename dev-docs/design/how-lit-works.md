# How lit-html Works

## About this Document

This is an overview for how lit-html works, what makes it fast, and how the code is organized. It's intended for contributors, or anyone who is interested in the inner workings of lit-html.

All the source code described by this document can be found in [`lit-html.ts`](https://github.com/lit/lit/blob/main/packages/lit-html/src/lit-html.ts).

The source code itself is generally optimized to be read and we try to be as clear and self-documenting as possible, erring on the side of verbosity, with numerous comments when needed to explain why code is written as it is. We expect the source to be optimized by tools, so we can keep it understandable by humans.

If anything is unclear or you have questions, reach out on our [Discord channel](https://discord.com/invite/buildWithLit), or ask a question on [GitHub Discussions](https://github.com/lit/lit/discussions). All our communities can be found on the [Lit Community page](https://lit.dev/docs/resources/community/).

# What is lit-html?

lit-html is an HTML templating library. Templates are written in JavaScript by mixing static HTML strings and dynamic JavaScript values using template literals. lit-html enables a functional / UI-as-data programming model, fast initial rendering, and fast updates that minimally update DOM when state changes.

The key feature that enables this is separating static parts of templates from the dynamic parts with template literals, and never traversing or updating the static parts after the initial render. This makes lit-html very performant as can be seen in the [JS Frameworks Benchmark](https://krausest.github.io/js-framework-benchmark/). A great companion to this document is [Justin Fagnani's lit-html talk](https://youtu.be/Io6JjgckHbg?t=1032).

# Foundational Pieces

lit-html relies on two key platform features for its performance and ergonomics: [JavaScript Tagged Template Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates) and the HTML [`<template>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) element.

## JavaScript Tagged Template Literals

lit-html's rendering process starts with defining a template with a [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates).

A _tagged_ template literal is essentially a function call that passes the strings literals and the values of expressions to the tag function.

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

```js
strings: ["<div>", "</div>", raw: Array(2)]
values: ["abc"]
```

A tag function can return any object, it does not have to return a string.

The first argument to the tag is a special array of strings that retains its identity across multiple evaluations of the tagged literal, and is always the exact same array of strings.

We can see that the identity is preserved if we put the tagged literal in a function:

```js
// Store how many times we've seen each literal
let counts = new Map();

// A template tag that updates the count storage and longs the count
let count = (strings) => {
  // The strings object is our Map key
  let c = (counts.get(strings) || 0) + 1;
  counts.set(strings, c);
  console.log(`literal '${strings.join('')}' seen ${c} time(s)`);
};

// Different invocations of this function return the same tagged template literal.
let fn = (val) => count`static portion of template with a dynamic value:${val}`;

// These two functions call the same tag function. Thus both `f` and `g` will increment
// the count for the same template strings array even though the dynamic values are different.
let f = () => fn('abc');
let g = () => fn('def');

f();
g();
```

Prints:

```bash
literal 'static portion of template with a dynamic value:' seen 1 time(s)
literal 'static portion of template with a dynamic value:' seen 2 time(s)
```

lit-html uses the template strings array argument as a cache key to only do template preparation work on the first render to the page.

## The HTML `<template>` Element

The [`<template>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template) is a container for _inert_ HTML content. Its contents are parsed, but not rendered: scripts don't run, styles don't apply, Custom Elements don't upgrade, etc.

During parsing, or when setting `innerHTML`, nodes that would normally become children in other elements, are moved into the template's _content_ fragment: a `DocumentFragment` accessible via the `.content` property. A template's contents can be cloned or imported into a Document, which makes the cloned nodes active.

## Parts

A `Part` is a lit-html concept and represents the location of an expression in the `html` tagged template literal:

| Part                   | Description                                                        | Authored                               |
| ---------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `ChildPart`            | Expressions in HTML child position                                 | `` html`<div>${...}</div>`  ``         |
| `AttributePart`        | Expressions in HTML attribute value position                       | `` html`<input id="${...}">`  ``       |
| `BooleanAttributePart` | Expressions in a boolean attribute value (name prefixed with `?`)  | `` html`<input ?checked="${...}">`  `` |
| `EventPart`            | Expressions in an event listener position (name prefixed with `@`) | `` html`<input @click=${...}>`  ``     |
| `PropertyPart`         | Expressions in property value position (name prefixed with `.`)    | `` html`<input .value=${...}>`  ``     |
| `ElementPart`          | Expressions on the element tag                                     | `` html`<input ${...}>`  ``            |

In all the cases above the authored code pass an expression into `${<expr>}` which represents a dynamic binding to the template, and the different part types implement how the value is committed to the DOM. For instance the `EventPart` in `` html`<input @click=${() => console.log('clicked')}`  `` will take the user provided function, and manage `addEventListener` and `removeEventListener` calls on the DOM such that the passed function is called when the click event is triggered.

Knowing about Parts is useful when [writing custom directives](https://lit.dev/docs/templates/custom-directives/#parts).

# Rendering

lit-html templates are only a description of the UI. They must be rendered to affect the DOM. While there are a few internal phases to rendering, to users of Lit there appear to be only two: define and render.

Templates are most often written as functions that return a lit-html `TemplateResult`:

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

`render()` can be called multiple times with results of the same template, but different state, and the DOM will be updated to match the state. From the caller of `render()`'s point of view, there is little difference between an initial render and an update.

# Phases of Template Rendering

Templates go through distinct phases when rendering. Some of the work for rendering happens the first time a template is rendered anywhere on a page, some the first time a template is rendered to a particular container, and some when a template instance is updated with new data.

## 1. Define

Templates are defined with the `html` template tag. This tag does very little work - it only captures the current values and a reference to the strings object, and returns this as a `TemplateResult`.

lit-html ships with two template tags: `html` and `svg`. The `svg` tag is for defining SVG _fragment_ templates: it ensures that the elements created are in the SVG namespace.

The default `html` and `svg` tags are extremely simple, capturing the static strings and dynamic values in an object literal:

```js
const tag =
  (type) =>
  (strings, ...values) => ({
    ['_$litType$']: type,
    strings,
    values,
  });
const html = tag(/* HTML_RESULT type:*/ 1);
const svg = tag(/* SVG_RESULT type:*/ 2);
```

Evaluating a template expression can be _extremely_ fast. It's only as expensive as the JavaScript expressions in the template, two function calls and an object allocation.

## 2. Prepare

When a template is rendered for the very first time on a page, it must be prepared. Preparation creates a `<template>` element that can be cloned to create new instances and stores metadata about the expressions so that updatable Parts can be created for the instance.

### 2.1. Join the template's string literals with marker strings.

Source: [lit-html.ts `getTemplateHtml` function](https://github.com/lit/lit/blob/5d68be35c192e8c4109911eec727fbb598557f72/packages/lit-html/src/lit-html.ts#L667)

This is a pass over the static strings portion of the `html` tag function returning an annotated HTML string, along with the case-sensitive bound attribute names in template order. The returned HTML contains the following annotations:

- Expressions in text position (ie, `<p>${}</p>`), are marked with a comment node: `<!--lit$random$-->`
- Expressions in attribute position (ie, `<p class="${}"></p>`), are marked with a sentinel string: `<p class$lit$="lit$random$"></p>`

For attributes with expressions, we also append the suffix `$lit$` to the attribute name. This is so special-cased attributes like `style` and `class` and many SVG attributes aren't handled by the browser at a point when they contain marker expressions. (IE and Edge parse the `style` attribute value and discard it if it's invalid CSS for instance).

### 2.2. Create a `<template>` element

The HTML string from step 2.1 is used to set the `innerHTML` of a new `<template>` element. This causes the browser to parse the template HTML. Text-position markers that were written as comments are parsed into comment nodes.

Because this step does not use any provided values (and because templates are inert), this step is safe from XSS vulnerabilities or other malicious input.

### 2.3. Create a lit-html `Template`

The `Template` class does most of the heavy-lifting for preparing a template. It walks the tree of nodes in a `<template>` element finding the markers inserted in step 2.1. If a marker is found, either in an attribute, as a marker comment node, or in text content, the depth-first index of the node is recorded, along with the type of expression (`'text'` or `'attribute'`) and the name of the attribute. The metadata containing the depth-first index of the node and type of expression is called a `TemplatePart` in the source. A `TemplatePart` is not the same as the `Parts` mentioned [in the Parts section](#parts), but is the inert definition for what `Part` should be created later during the [Create Parts](#32-clone-the-template-and-instantiate-parts) phase.

When traversing the tree of nodes, `Template` does different work for specific Node types:

#### Element

For each attribute on the element, if it has a `$lit$` suffix, then the expression represents either a `PropertyPart`, `BooleanAttributePart`, `EventPart`, or `AttributePart`. These can be distinguished by the first character in the attribute name ([see authored colum in Parts table](#parts)).

An attribute on the element may also represent an `ElementPart` in the case where the attribute name starts with the marker sentinel value. E.g. `<div ${} ${}>` is marked up as `<div lit$random$0="" lit$random$1="">`.

For each of the bound attributes identified, they are removed from the element and a `TemplatePart` is created to record the location, name, and type of dynamic binding.

#### Text

Usually text-position markers will be comment nodes, but inside `<style>`, `<script>`, `<textarea>`, `<title>` tags the markup that _looks_ like a comment (`<!-- lit -->`) will just be inserted as _text_ in the script or style. So we must search for the marker as text. If found we split the Text node and insert a comment marker.

#### Comment

A Comment is usually either an expression marker, or a user-written comment with no expression associated with them. Occasionally though a user may have written an expression inside a comment. This is especially easy to do with IDEs that help comment out code sections and are inline-html aware. We might see a comment like `<!--<div>${text}</div>-->` in the template text, so we must scan comments for marker text.

A comment that matches an expression marker ([added in step 2.1](#21-join-the-templates-string-literals-with-a-marker-string)), marks a `TemplatePart` in ChildPart position.

## 3. Create

The create phase is performed when rendering for the the first time to a specific container or Part.

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

The `TemplateResult` returned from `postBodyTemplate(post.body)` is rendered to the `ChildPart` defined by the expression markers.

</blockquote>

<blockquote>

Note: When a `TemplateResult` is rendered to a container or Part we get its `Template` via a `_$getTemplate` which is responsible for creating and caching Template objects.

Certain extensions to lit-html may override `_$getTemplate` to modify templates or cache based on additional keys. `shady-render.js` library uses `ShadyCSS` (part of the Shadow DOM polyfills) to modify templates for CSS scoping, and caches templates based on their scope identifier in addition to their template strings.

`_$getTemplate` is what initiates the [Prepare step](#2-prepare) if a `Template` is not yet in the cache.

</blockquote>

### 3.1 Create a `TemplateInstance`

`TemplateInstance` is responsible for creating the initial DOM and updating that DOM. It's an updatable instance of a `Template`. The `TemplateInstance` holds references to the Parts used to update the DOM.

### 3.2 Clone the template and instantiate Parts

Within `TemplateInstance._clone()`, first the inert `<template>` element is cloned into a document fragment.

After cloning, we walk the document fragment node tree to associate nodes with `TemplatePart`s by depth-first-index. When a node's index matches the index stored on a `TemplatePart`, a Part instance is created for the node. Based on the data in the `TemplatePart`, one of `ChildPart`, `AttributePart`, `PropertyPart`, `EventPart`, `BooleanAttributePart`, or `ElementPart` is instantiated.

These Part instances are stored on the `TemplateInstance`.

## 4. Update

The update step, which is performed for initial renders as well, is performed in `TemplateInstance._update()`.

Updates are performed by iterating over the parts and values array, and calling `part._$setValue(value)`.

What happens when a value is updated on a Part is determined by the parts themselves.
Every single Part type will also call `resolveDirective` very early in the logic and reassign `value` to the returned value. This is [how directives can customize and extend how an expression renders](https://lit.dev/docs/templates/directives/).

### ChildPart.\_$setValue

Setting a value on a ChildPart occurs whenever the authored template has a dynamic expression in child part position, and the value is whatever has been passed into the tagged template literal expression.

Some examples of authored templates that all result in rendering `<div>hi</div>` via a ChildPart:

- `` html`<div>${"hi"}</div>` ``, sets the string literal value `"hi"` on the child part.
- `` html`<div>${html`hi`}</div>` ``, sets the TemplateResult value `` html`<p>Hi</p>` `` on the child part.
- `` html`<div>${['h', 'i']}</div>` ``, sets the iterable on the child part.
- `` html`<div>${document.createTextNode('hi')}</div>` ``, sets the Text node on the child part.

At a very high level, `ChildPart` tracks the last value it was updated with via `_$committedValue`, skipping any work if the passed value is equal to the last committed value. This is how ChildParts diff changes at the value level.
If the `value` being set on the ChildPart is not the same as `_$committedValue`, then the value is processed (differently based on the type) into a Node or Nodes and is committed to the DOM. Then the `value` is set on `_$committedValue` so the following `_$setValue` call can omit additional work if the value is unchanged.

Primitive values set on a `ChildPart`, (`null`, `undefined`, `boolean`, `number`, `string`, `symbol`, or `bigint`), create or update a Text node. Committing a text node is done in `_commitText`, which is also where text sanitization occurrs.

If the value is a `TemplateResult`, then ChildPart executes `_commitTemplateResult` which renders that `TemplateResult` into the ChildPart, [creating and updating](#3-create) that `TemplatResult`.

If the value is a Node, the the ChildPart clears any previously rendered nodes and inserts the Node value directly.

### AttributePart.\_$setValue

In the single binding attribute value case such as `` html`<input value=${...}>` ``, an `AttributePart` also uses `_$committedValue` to not do extra work. Values are committed by calling `this.element.setAttribute(name, value)`.

`AttributePart` also handles the more complex cases with multiple bindings in attribute value position: `` html`<div class="${...} static-class ${...}"></div>` ``. Multiple values are also committed with a `setAttribute` call after the values are evaluated and joined together.

### PropertyPart.\_$setValue

`PropertyPart` extends `AttributePart`, with the only difference being that committing the value to the live DOM is not via `setAttribute(name, value)`, but instead as a property via `this.element[name] = value`. E.g. `` html`<input .value=${'hi'}>` `` will commit the value `'hi'` with `inputEl.value = 'hi'`.

### BooleanAttributePart.\_$setValue

BooleanAttributePart also extends `AttributePart`, and overrides `_commitValue`. When a value is committed to a `BooleanAttributePart`, a falsy or `nothing` value will remove the attribute, and a truthy value will set the attribute with an empty string attribute value.

### EventPart.\_$setValue

EventPart also extends `AttributePart`, and overrides `_$setValue` to take the user provided event listener and then call `this.element.addEventListener(attributeName, value)`.
The EventPart ensures that event listeners are added and cleaned up between renders and if the passed in value changes.

A value of `null`, `undefined`, or `nothing` will remove any previously set listeners without adding a new listener.

### ElementPart.\_$setValue

Nothing can be committed via an ElementPart. Instead `resolveDirective` is called, allowing directives to hook into the `ElementPart` position.

For example, [`@lit-labs/motion` has an `animate` directive](https://lit.dev/playground/#sample=examples/motion-simple) that can be applied on an element in the `ElementPart` location to then manage the elements animations.
