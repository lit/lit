---
layout: guide
title: Styles
slug: styles
---

{::options toc_levels="1..3" /}
* ToC
{:toc}

This page describes how to add styles to your component.

Your component's template is rendered to its shadow DOM tree. The styles you add to your component are automatically _scoped_ to the shadow tree, so they don't leak out and affect other elements. 


## Add styles to your component {#add-styles}

For optimal performance, define scoped styles in a static `styles` property. 

Define styles in a tagged template literal, using the `css` tag function:  

```js
import { LitElement, css, html } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    return css`
      div { color: red; }
    `;
  }
  render() { 
    return html`
      <div>I'm styled!</div> 
    `;
  }
}
```

The styles you add to your component are _scoped_ using shadow DOM. For a quick overview of shadow DOM styling, see [Shadow DOM styling overview](#shadow-dom).

The value of the static `styles` property can be:
    
*   A single tagged template literal.
    
    ```js
    static get styles() {
      return css`...`;
    } 
    ```

*   An array of tagged template literals.

    ```js
    static get styles() {
      return [ css`...`, css`...`];
    }
    ```

The static `styles` property is _usually_ the best way to add styles to your component, but 
there are some use cases you can't handle this way—for example, linking to an external style sheet.
For alternate ways to add styles, see [Define scoped styles in the template](#styles-in-the-template).

### Expressions in static styles {#expressions}

Static styles apply to all instances of a component. Any expressions in CSS are evaluated **once**, then reused for all instances. 

To allow for theming or per-instance style customization, use CSS variables and custom properties to create [configurable styles](#configurable).

To prevent LitElement-based components from evaluating potentially malicious code, the `css` tag only  allows nested expressions that are themselves `css` tagged strings or numbers.

```js
{% include projects/style/nestedcss/my-element.js %}
```

{% include project.html folder="style/nestedcss" openFile="my-element.js" %}

This restriction exists to protect applications from security vulnerabilities whereby malicious styles, or even malicious code, can be injected from untrusted sources such as URL parameters or database values.

If you must use an expression in a `css` literal that is not itself a `css` literal, **and** you are confident that the expression is from a fully trusted source such as a constant defined in your own code, then you can wrap the expression with the `unsafeCSS` function:

```js
{% include projects/style/unsafecss/my-element.js %}
```

{% include project.html folder="style/unsafecss" openFile="my-element.js" %}

{:.alert .alert-warning}
<div>

**Only use the `unsafeCSS` tag with trusted input.** Injecting unsanitized CSS is a security risk. For example,
malicious CSS can "phone home" by adding an image URL that points to a third-party server.

</div>

### Inheriting styles

Using an array of tagged template literals, a component can inherit the styles from a LitElement superclass, and add its own styles:

```js
class MyElement extends SuperElement {
  static get styles() {
    return [
      super.styles,
      css`...`
    ];
  }
}
```

{% include project.html folder="style/superstyles" openFile="my-element.js" %}

### Sharing styles

You can share styles between components by creating a module that exports tagged
styles:

```js
import { css } from 'lit-element';

export const buttonStyles = css`
  .blue-button {
    color: white;
    background-color: blue;
  }
  .blue-button:disabled {
    background-color: grey;
  }`;
```

Your element can then import the styles and add them to its static `styles` property:

```js
import { buttonStyles } from './button-styles.js';

class MyElement extends LitElement {
  static get styles() {
    return [
      buttonStyles,
      css`
        :host { display: block;
          border: 1px solid black;
        }`
    ]
  }
  ...
}
```

You can also import an external style sheet by adding a `<link>` element to your template, but this has a number of limitations. For details, see [Import an external stylesheet](#external-stylesheet).

## Shadow DOM styling overview {#shadow-dom}

This section gives a brief overview of shadow DOM styling.

Styles you add to a component can affect:

* The shadow tree (your component's rendered template).
* The component itself.
* The component's children.


### Style the shadow tree {#shadowroot}

LitElement templates are rendered into a shadow tree by default. Styles scoped to an element's shadow tree don't affect the main document or other shadow trees. Similarly, with the exception of [inherited CSS properties](#inheritance), document-level styles don't affect the contents of a shadow tree.

When you use standard CSS selectors, they only match elements in your component's shadow tree.

```js
class MyElement extends LitElement {
  static get styles() {
    // Write styles in standard CSS
    return css`
      * { color: red; }
      p { font-family: sans-serif; }
      .myclass { margin: 100px; }
      #main { padding: 30px; }
      h1 { font-size: 4em; }
    `;
  }
  render() {
    return html`
      <p>Hello World</p>
      <p class="myclass">Hello World</p>
      <p id="main">Hello World</p>
      <h1>Hello World</h1>
    `;
  }
}
```

{% include project.html folder="style/styleatemplate" openFile="my-element.js" %}

### Style the component itself

You can style the component itself using special `:host` selectors. (The element that owns, or "hosts" a shadow tree is called the _host element_.)

To create default styles for the host element, use the `:host` CSS pseudo-class and `:host()` CSS pseudo-class function.

*   `:host` selects the host element.

*   <code>:host(<var>selector</var>)</code> selects the host element, but only if the host element matches _selector_.

```js
static get styles() {
  return css`
    /* Selects the host element */
    :host { 
      display: block; 
    }

    /* Selects the host element if it is hidden */
    :host([hidden]) { 
      display: none; 
    }
  `;
}
```

{% include project.html folder="style/host" openFile="my-element.js" %}

Note that the host element can be affected by styles from outside the shadow tree, as well, so you should consider 
the styles you set in `:host` and `:host()` rules as _default styles_ that can be overridden by the user. For example:

```css
my-element {
  display: inline-block;
}
```

### Style the component's children

Your component may accept children (like a `<ul>` element can have `<li>` children). To render children, your template needs to include one or more `<slot>` elements, as described in [Render children with the slot element](templates#slots).

The `<slot>` element acts as a placeholder in a shadow tree where the host element's children are displayed. For example: 

```js
class MyElement extends LitElement {
  render() {
    return html`<slot></slot>`;
  }
}
```

```html
<my-element><p>Slotted content</p></my-element>
```

{% include project.html folder="style/slottedbase" openFile="my-element.js" %}

Use the `::slotted()` CSS pseudo-element to select children that are included in your template via `<slot>`s.

*   `::slotted(*)` matches all slotted elements.

*   `::slotted(p)` matches slotted paragraphs.

*   `p ::slotted(*)` matches slotted elements where the `<slot>` is a descendant of a paragraph element.

    ```html
    <p>
      <slot></slot>
    </p>
    ```

```js
{% include projects/style/slottedselector/my-element.js %}
```

{% include project.html folder="style/slottedselector" openFile="my-element.js" %}

Note that **only direct slotted children** can be styled with `::slotted()`. 

```html
<my-element>
  <div>Stylable with ::slotted()</div>
</my-element>

<my-element>
  <div><p>Not stylable with ::slotted()</p></div>
</my-element>
```

Also, children can 
be styled from outside the shadow tree, so you should regard your `::slotted()` styles as
default styles that can be overridden.

```css
my-element div {
  // Outside style targetting a slotted child can override ::slotted() styles
}
```


{:.alert .alert-info}
<div>

**Watch out for limitations in the Shady CSS polyfill around slotted content!** See the [Shady CSS limitations](https://github.com/webcomponents/polyfills/tree/master/packages/shadycss#limitations) for details on how to use the `::slotted()` syntax in a polyfill-friendly way. 

</div>

### Configurable styles with custom properties {#configurable}

Static styles are evaluated once per class. Use CSS variables and custom properties to make styles that can be configured at runtime:

```js
static get styles() {
  return css`
    :host { color: var(--themeColor); }
  `;
} 
```

```html
<style>
  html { 
    --themeColor: #123456;
  }
</style>
<my-element></my-element>
```

See the section on [CSS custom properties](#customprops) for more information. 



## Define scoped styles in the template {#styles-in-the-template}

We recommend using static styles for optimal performance.  However, sometimes you may want to
define styles in the LitElement template. There are two ways to add scoped styles in the template:

*   Add styles using a `<style>` element.
*   Add styles using an external style sheet.

Each of these techniques has its own set of advantages and drawbacks.

### In a style element

We recommend using static styles for optimal performance. However, static styles are evaluated **once per class**. Sometimes, you might need to evaluate styles per instance.

We recommend using CSS properties to create [customizable styles](#customizable). However, you can also include `<style>` elements in a LitElement template. These are updated per instance.

```js
render() {
  return html`
    <style>
      /* updated per instance */
    </style>
    <div>template content</div>
  `;
}
```

#### Expressions and style elements

The most intuitive way to evaluate per-instance styles has some important limitations and performance issues. We consider the example below to be an anti-pattern:

```text
// Anti-pattern!
render() {
  return html`
    <style>
      :host {
        /* Warning: this approach has limitations & performance issues! */
        color: ${myColor}
      } 
    </style>
    <div>template content</div>
  `;
}
```

Expressions inside a `<style>` element won't update per instance in ShadyCSS, due to limitations of the ShadyCSS polyfill. See the [ShadyCSS readme](https://github.com/webcomponents/shadycss/blob/master/README.md#limitations) for more information.

Additionally, evaluating an expression inside a `<style>` element is inefficient. When any text inside a `<style>` element changes, the browser must re-parse the whole `<style>` element, resulting in unnecessary work. 

If you need to evaluate expressions inside a `<style>` element, use the following strategy to avoid creating performance problems:

*   Separate styles that require per-instance evaluation from those that don't.

*   Evaluate per-instance CSS properties by creating an expression that captures that property inside a complete `<style>` block. Include it in your template.

**Example**

```js
{% include projects/style/perinstanceexpressions/my-element.js %}
```

{% include project.html folder="style/perinstanceexpressions" openFile="my-element.js" %}

### Import an external stylesheet {#external-stylesheet}

We recommend placing your styles in a static `styles` property for optimal performance. However, you can include an external style sheet in your template with a `<link>`:

```js
{% include projects/style/where/my-element.js %}
```

{% include project.html folder="style/where" openFile="my-element.js" %}

There are some important caveats though:

*  The [ShadyCSS polyfill](https://github.com/webcomponents/shadycss/blob/master/README.md#limitations) doesn't support external style sheets.

*   External styles can cause a flash-of-unstyled-content (FOUC) while they load.

*   The URL in the `href` attribute is relative to the **main document**. This is okay if you're building an app and your asset URLs are well-known, but avoid using external style sheets when building a reusable element.

## Dynamic classes and styles

One way to make styles dynamic is to add bindings to the `class` or `style` attributes in your template.

The lit-html library offers two directives, `classMap` and `styleMap`, to conveniently apply classes and styles in HTML templates. 

For more information on these and other lit-html directives, see the documentation on [lit-html built-in directives](https://lit-html.polymer-project.org/guide/template-reference#built-in-directives).

To use `styleMap` and/or `classMap`:

1.  Import `classMap` and/or `styleMap`:

    ```js
    import { classMap } from 'lit-html/directives/class-map';
    import { styleMap } from 'lit-html/directives/style-map';
    ```

2.  Use `classMap` and/or `styleMap` in your element template:

    ```js
    constructor() {
      super();
      this.classes = { mydiv: true, someclass: true };
      this.styles = { color: 'green', fontFamily: 'Roboto' };
    }
    render() {
      return html`
        <div class=${classMap(this.classes)} style=${styleMap(this.styles)}>
          Some content
        </div>
      `;
    }
    ```

{% include project.html folder="style/maps" openFile="my-element.js" %}

### classMap syntax {#classmap}

`classMap` applies a set of classes to an HTML element:

```html
<div class=${classMap({alert:true,info:true})}>Content.</div>
<!-- Equivalent: <div class="alert info">Content.</div> -->
```

{% include project.html folder="style/classmap" openFile="my-element.js" %}

### styleMap syntax {#stylemap}

`styleMap` applies a set of CSS rules to an HTML element:

```html
<button style=${styleMap({
  backgroundColor: 'blue',
  border: '1px solid black'
})}>A button</button>

<!-- Equivalent: 
  <button style="
    background-color:blue;
    border: 1px solid black;
  ">A button</button>
-->
```

{% include project.html folder="style/stylemap" openFile="my-button.js" %}

To refer to hyphenated properties such as `font-family`, use the camelCase equivalent (`fontFamily`) or place the hyphenated property name in quotes (`'font-family'`). 

To refer to custom CSS properties such as `--custom-color`, place the whole property name in quotes (`'--custom-color'`).

|**Inline style or CSS**|**styleMap equivalent**|
|----|----|
| `background-color: blue;` <br/> | `backgroundColor: 'blue'` <br/><br/> or <br/><br/>`'background-color': 'blue'`|
| `font-family: Roboto, Arial, sans-serif;` <br/> | `fontFamily: 'Roboto, Arial, sans-serif'` <br/><br/> or <br/><br/>`'font-family': 'Roboto, Arial, sans-serif'`|
|`--custom-color: #FFFABC;`|`'--custom-color': '#FFFABC;'`|
|`--otherCustomColor: #FFFABC;`|`'--otherCustomColor': '#FFFABC;'`|
|`color: var(--customprop, blue);`|`color: 'var(--customprop, blue)'`|

**Examples**

Inline style syntax:

```html 
<div style="
  background-color:blue;
  font-family:Roboto;
  --custom-color:#e26dd2;
  --otherCustomColor:#77e26d;">
</div>
```

Equivalent CSS syntax:

```css
div {
  background-color: blue;
  font-family: Roboto;
  --custom-color: #e26dd2;
  --otherCustomColor: #77e26d;
}
```

Equivalent `styleMap` syntax:

```js 
html`
  <div style=${styleMap({
    'background-color': 'blue',
    fontFamily: 'Roboto',
    '--custom-color': '#e26dd2',
    '--otherCustomColor': '#77e26d'
  })}></div>
`
```

{% include project.html folder="style/stylemap2" openFile="index.html" %}

## Theming

*   Use [**CSS inheritance**](#inheritance) to propagate style information to LitElement components and their rendered templates.

    ```html
    <style>
      html {
        --themeColor: #123456;
        font-family: Roboto;
      }
    </style>

    <!-- host inherits `--themeColor` and `font-family` and
         passes these properties to its rendered template -->
    <my-element></my-element>
    ```

*   Use [**CSS variables and custom properties**](#customprops) to configure styles per-instance.

    ```html
    <style>
      html {
        --my-element-background-color: /* some color */;
      }
      .stuff {
        --my-element-background-color: /* some other color */;
      }
    </style>
    <my-element></my-element>
    <my-element class="stuff"></my-element>
    ```

    ```js
    // MyElement's static styles
    static get styles() {
      return css`
        :host {
          background-color: var(--my-element-background-color);
        }
      `;
    }
    ```

### CSS inheritance {#inheritance}

CSS inheritance lets parent and host elements propagate certain CSS properties to their descendents.

Not all CSS properties inherit. Inherited CSS properties include:

* `color`
* `font-family` and other `font-*` properties
* All CSS custom properties (`--*`)

See [CSS Inheritance on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/inheritance) for more information.

You can use CSS inheritance to set styles on an ancestor element that are inherited by its descendents:

```html
<style>
html { 
  font-family: Roboto;
}
</style>
<div>
  <p>Uses Roboto</p>
</div>
```

Similarly, host elements pass down inheritable CSS properties to their shadow trees. 

You can use the host element's type selector to style it:

```html
<style>
  my-element { font-family: Roboto; }
</style>
<my-element></my-element>
```

```js
class MyElement extends LitElement {
  render() { 
    return html`<p>Uses Roboto</p>`; 
  }
}
```

{% include project.html folder="style/inherited3" openFile="index.html" %}

You can also use the `:host` CSS pseudo-class to style the host from inside its own template:

```js
static get styles() {
  return css`
    :host {
      font-family: Roboto;
    }
  `;
}
render() {
  return html`
    <p>Uses Roboto</p>
  `;
}
```

{% include project.html folder="style/inherited" openFile="my-element.js" %}

{:.alert .alert-info}
<div id="specificity">

**Type selectors have higher specificity than :host.**

An element type selector has higher specificity than the `:host` pseudo-class selector. Styles set for a custom element tag will override styles set with `:host` and `:host()`:

```html
<style>
  my-element { font-family: Courier; }
</style>
<my-element></my-element>
```

```js
class MyElement extends LitElement {
  static get styles() { 
    return css`:host { font-family: Roboto; }`
  }
  render() {
    return html`<p>Will use courier</p>`;
  }
}
```

{% include project.html folder="style/specificity" openFile="index.html" %}

</div>

### CSS custom properties {#customprops}

All CSS custom properties (<code>--<var>custom-property-name</var></code>) inherit. You can use this to make your component's styles configurable from outside. 

The following component sets its background color to a CSS variable. The CSS variable uses the value of `--my-background` if it's available, and otherwise defaults to `yellow`:

```js
class MyElement extends LitElement {
  static get styles() { 
    return css`
      :host { 
        background-color: var(--my-background, yellow); 
      }
    `;
  }
  render() {
    return html`<p>Hello world</p>`;
  }
}
```

Users of this component can set the value of `--my-background`, using the `my-element` tag as a CSS selector:

```html
<style>
  my-element {
    --my-background: rgb(67, 156, 144);
  }
</style>
<my-element></my-element>
```

`--my-background` is configurable per instance of `my-element`:

```html
<style>
  my-element {
    --my-background: rgb(67, 156, 144);
  }
  my-element.stuff {
    --my-background: #111111;
  }
</style>
<my-element></my-element>
<my-element class="stuff"></my-element>
```

If a component user has an existing app theme, they can easily set the host's configurable properties to use theme properties:

```html
{% include projects/style/customproperties/index.html %}
```

{% include project.html folder="style/customproperties" openFile="index.html" %}

See [CSS Custom Properties on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) for more information.

### A simple example theme {#example-theme}

_index.html_

```html
{% include projects/style/theming/index.html %}
```

_my-element.js_

```js
{% include projects/style/theming/my-element.js %}
```

{% include project.html folder="style/theming" openFile="theme.css" %}
