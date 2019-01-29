---
layout: post
title: Styling templates
slug: styling-templates
---

lit-html focuses on one thing: rendering HTML. How you apply styles to the HTML lit-html creates depends on how you're using it—for example, if you're using lit-html inside a component system like LitElement, you can follow the patterns used by that component system.

In most cases you should **not** use lit-html bindings inside a style sheet. It's more efficient to use lit-html bindings to manipulate the `class` and `style` attributes.  

lit-html provides two directives for manipulating an element's `class` and `style` attributes:

*   [`classMap`](template-reference#classmap) sets classes on an element based on the properties of an object.
*   [`styleMap`](template-reference#stylemap) sets the styles on an element based on a map of style properties and values.

See [classMap](template-reference#classmap) and [styleMap](template-reference#stylemap) in the Template syntax reference.

There are also some special considerations when using lit-html to render into a shadow root.

## Rendering in shadow DOM

When rendering into a shadow root, you usually want to add a stylesheet inside the shadow root to the template, to you can style the contents of the shadow root. 

```js
html`
  <style>
    :host { ... } 
    .test { ... }
  </style> 
  <div class="test">...</div> 
`;
```


### Don't use bindings in stylesheets 

As long as the contents of the stylesheet stay identical, the browser should be able to deduplicate multiple instances of the same stylesheet. Binding to values in the stylesheet is an antipattern, because it defeats the browser's stylesheet optimizations.

```js
// DON'T DO THIS
html`
  <style>
    :host {
      background-color: ${themeColor};  \
    }
  </style>
  ... 
```

Alternatives to using bindings in a style sheet:

*   Use [CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) to pass values down the tree.
*   Use bindings in the `class` and `style` attributes to control the styling of child elements.

	


### Polyfilled shadow DOM: ShadyDOM and ShadyCSS

If you're using shadow DOM, you'll probably need to use polyfills to support older browsers that don't implement shadow DOM natively. [ShadyDOM](https://github.com/webcomponents/shadydom) and [ShadyCSS](https://github.com/webcomponents/shadycss) are polyfills, or shims, that emulate shadow DOM isolation and style scoping. 

The lit-html `shady-render` module provides necessary integration with the shady CSS shim. If you're writing your own custom element base class that uses lit-html and shadow DOM, you'll need to use `shady-render` and also take some steps on your own. 

The [ShadyCSS README](https://github.com/webcomponents/shadycss#usage) provides some directions for using shady CSS. When using it with `lit-html`:

*   Import `render` and `TemplateResult` from the `shady-render` library.
*   You **don't** need to call `ShadyCSS.prepareTemplate`.  Instead pass the scope name as a render option. For custom elements, use the element name as a scope name. For example:

    ```js
    import { render, TemplateResult } from 'lit-html/lib/shady-render';

    render(this.myTemplate(), this.shadowRoot, { scopeName: this.tagName.toLowerCase() });
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
