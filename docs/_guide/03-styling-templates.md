---
layout: post
title: Styling templates
slug: styling-templates
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

lit-html focuses on one thing: rendering HTML. How you apply styles to the HTML lit-html creates depends on how you're using it—for example, if you're using lit-html inside a component system like LitElement, you can follow the patterns used by that component system.

In general, how you style HTML will depend on whether you're using shadow DOM:

*   If you aren't using shadow DOM, you can style HTML using global style sheets.
*   If you're using shadow DOM (for example, in LitElement), then you can add style sheets inside the shadow root.

To help with dynamic styling, lit-html provides two directives for manipulating an element's `class` and `style` attributes:

*   [`classMap`](template-reference#classmap) sets classes on an element based on the properties of an object.
*   [`styleMap`](template-reference#stylemap) sets the styles on an element based on a map of style properties and values.

## Rendering in shadow DOM

When rendering into a shadow root, you usually want to add a style sheet inside the shadow root to the template, to you can style the contents of the shadow root. 

```js
html`
  <style>
    :host { ... } 
    .test { ... }
  </style> 
  <div class="test">...</div> 
`;
```

This pattern may seem inefficient, since the same style sheet is reproduced in a each instance of an element. However, the browser can deduplicate multiple instances of the same style sheet, so the cost of parsing the style sheet is only paid once. 

A new feature available in some browsers is [Constructable Stylesheets Objects](https://wicg.github.io/construct-stylesheets/). This proposed standard allows multiple shadow roots to explicitly share style sheets. LitElement uses this feature in its [static `styles` property](https://lit-element.polymer-project.org/guide/styles#define-styles-in-a-static-styles-property). 

### Bindings in style sheets 

Binding to values in the style sheet is an antipattern, because it defeats the browser's style sheet optimizations. It's also not supported by the ShadyCSS polyfill.

```js
// DON'T DO THIS
html`
  <style>
    :host {
      background-color: ${themeColor};
    }
  </style>
  ... 
```

Alternatives to using bindings in a style sheet:

*   Use [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) to pass values down the tree.
*   Use bindings in the `class` and `style` attributes to control the styling of child elements.

See [Inline styles with styleMap](#stylemap) and [Setting classes with classMap](#classmap) for examples of binding to the `style` and `class` attributes.


### Polyfilled shadow DOM: ShadyDOM and ShadyCSS

If you're using shadow DOM, you'll probably need to use polyfills to support older browsers that don't implement shadow DOM natively. [ShadyDOM](https://github.com/webcomponents/shadydom) and [ShadyCSS](https://github.com/webcomponents/shadycss) are polyfills, or shims, that emulate shadow DOM isolation and style scoping. 

The lit-html `shady-render` module provides necessary integration with the shady CSS shim. If you're writing your own custom element base class that uses lit-html and shadow DOM, you'll need to use `shady-render` and also take some steps on your own. 

The [ShadyCSS README](https://github.com/webcomponents/shadycss#usage) provides some directions for using shady CSS. When using it with `lit-html`:

*   Import `render` and `TemplateResult` from the `shady-render` library.
*   You **don't** need to call `ShadyCSS.prepareTemplate`.  Instead pass the scope name as a render option. For custom elements, use the element name as a scope name. For example:

    ```js
    import {render, TemplateResult} from 'lit-html/lib/shady-render';

    class MyShadyBaseClass extends HTMLElement {

      // ...

      _update() {
        render(this.myTemplate(), this.shadowRoot, { scopeName: this.tagName.toLowerCase() });
      } 
    }
    ```

    Where `this.myTemplate` is a method that returns a `TemplateResult`.

*   You **do** need to call `ShadyCSS.styleElement` when the element is connected to the DOM, and in case of any dynamic changes that might affect custom property values.

	For example, consider a set of rules like this: 
    ```js
    my-element { --theme-color: blue; }
	main my-element { --theme-color: red; }
    ```

	If you add an instance of `my-element` to a document, or move it, a different value of `--theme-color` may apply. On browsers with native custom property support, these changes will take place automatically, but on browsers that rely on the custom property shim included with shadyCSS, you'll need to call `styleElement`.

    ```js
    connectedCallback() {
      super.connectedCallback();
      if (window.shadyCSS !== undefined) {
          window.shadyCSS.styleElement(this);
      }
    }
    ```

## Inline styles with styleMap {#stylemap}

You can use the `styleMap` directive to set inline styles on an element in the template.

```js
const normalStyles = {};
const highlightStyles = { color: 'white', backgroundColor: 'red'};
let highlight = true;

const myTemplate = () => {
  html`
    <div style=${styleMap(highlight ? highlightStyles : normalStyles)}>
      Hi there!
    </div>
  `;
};
```

More information: see See [styleMap](template-reference#stylemap) in the Template syntax reference.

## Setting classes with classMap {#classmap}

Like `styleMap`, the `classMap` directive lets you set a group of classes based on an object:

```js
// Define a base set of classes for all menu items
const baseClasses = { 
  'menu-item': true,
  // ...
};

const itemTemplate = (item) => {
  // Merge in dynamically-generated classes
  const mergedClasses = Object.assign({active: item.active}, baseClasses);
  return html`<div class=${classMap(mergedClasses)}>Classy text</div>`
}
```

More information: see [classMap](template-reference#classmap) in the Template syntax reference.