---
title: Writing templates
slug: writing-templates
---

lit-html is a templating library that provides fast, efficient rendering and updating of HTML. It lets you express web UI as a function of data. 

This section introduces the main features and concepts in lit-html.


## Render static HTML

The simplest thing to do in lit-html is to render some static HTML. 

```js
import {html, render} from 'lit-html';

// Declare a template
const myTemplate = html`<div>Hello World</div>`;

// Render the template
render(myTemplate, document.body);
```

The lit-html template is a [_tagged template literal_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals). The template itself looks like a regular JavaScript string, but enclosed in backticks (`` ` ``) instead of quotes. The browser passes the string to lit-html's `html` tag function. 

The `html` tag function returns a `TemplateResult`—a lightweight object that represents the template to be rendered.

The `render` function actually creates DOM nodes and appends them to a DOM tree. In this case, the rendered DOM replaces the contents of the document's `body` tag.

## Render dynamic text content

You can't get very far with a static template. lit-html lets you create bindings using <code>${<em>expression</em>}</code> placeholders in the template literal:

```js
const aTemplate = html`<h1>${title}</h1>`;
```

To make your template dynamic, you can create a _template function_. Call the template function any time your data changes.

```js
import {html, render} from 'lit-html';

// Define a template function
const myTemplate = (name) => html`<div>Hello ${name}</div>`;

// Render the template with some data
render(myTemplate('world'), document.body);

// ... Later on ... 
// Render the template with different data
render(myTemplate('lit-html'), document.body);
```

When you call the template function, lit-html captures the current expression values. The template function doesn't create any DOM nodes, so it's fast and cheap.

The template function returns a `TemplateResult` that's a function of the input data. This is one of the main principles behind using lit-html: **creating UI as a _function_ of state**. 

When you call `render`, **lit-html only updates the parts of the template that have changed since the last render.** This makes lit-html updates very fast.

## Using expressions

The previous example shows interpolating a simple text value, but the binding can include any kind of JavaScript expression:

```js
const myTemplate = (subtotal, tax) => html`<div>Total: ${subtotal + tax}</div>`;
const myTemplate2 = (name) => html`<div>${formatName(name.given, name.family, name.title)}</div>`;
```

## Bind to attributes 

In addition to using expressions in the text content of a node, you can bind them to a node's attribute and property values, too.

By default, an expression in the value of an attribute creates an attribute binding:

```js
// set the class attribute
const myTemplate = (data) => html`<div class=${data.cssClass}>Stylish text.</div>`;
```

Since attribute values are always strings, the expression should return a value that can be converted into a string.

Use the `?` prefix for a boolean attribute binding. The attribute is added if the expression evaluates to a truthy value, removed if it evaluates to a falsy value:

```js
const myTemplate2 = (data) => html`<div ?disabled=${!data.active}>Stylish text.</div>`;
```

## Bind to properties

You can also bind to a node's JavaScript properties using the `.` prefix and the property name:

```js
const myTemplate3 = (data) => html`<input .value=${data.value}></input>`;
```

You can use property bindings to pass complex data down the tree to subcomponents. For example, if you have a `my-list` component with a `listItems` property, you could pass it an array of objects:

```js
const myTemplate4 = (data) => html`<my-list .listItems=${data.items}></my-list>`;
```

Note that the property name in this example—`listItems`—is mixed case. Although HTML attributes are case-insensitive, lit-html preserves the case when it processes the template.

## Add event listeners

Templates can also include declarative event listeners. An event listener looks like an attribute binding, but with the prefix `@` followed by an event name:

```js
const myTemplate = () => html`<button @click=${clickHandler}>Click Me!</button>`;
```

This is equivalent to calling `addEventListener('click', clickHandler)` on the button element.

The event listener can be either a plain function, or an object with a `handleEvent` method:

```js
const clickHandler = {
  // handleEvent method is required.
  handleEvent(e) { 
    console.log('clicked!');
  },
  // event listener objects can also define zero or more of the event 
  // listener options: capture, passive, and once.
  capture: true,
};
```

<div class="alert alert-info">

**Event listener objects.** When you specify a listener using an event listener object,
the listener object itself is set as the event context (`this` value).

</div>

## Nest and compose templates

You can also compose templates to create more complex templates. When a binding in the text content of a template returns a `TemplateResult`, the `TemplateResult` is interpolated in place.

```js
const myHeader = html`<h1>Header</h1>`;
const myPage = html`
  ${myHeader}
  <div>Here's my main page.</div>
`;
```

You can use any expression that returns a `TemplateResult`, like another template function: 

```js
// some complex view
const myListView = (items) => html`<ul>...</ul>`;

const myPage = (data) => html`
  ${myHeader}
  ${myListView(data.items)}
`;
```

 Composing templates opens a number of possibilities, including conditional and repeating templates.

### Conditional templates

lit-html has no built-in control-flow constructs. Instead you use normal JavaScript expressions and statements.

#### Conditionals with ternary operators

Ternary expressions are a great way to add inline conditionals:

```js
html`
  ${user.isloggedIn
      ? html`Welcome ${user.name}`
      : html`Please log in`
  }
`;
```


#### Conditionals with if statements

You can express conditional logic with if statements outside of a template to compute values to use inside of the template:

```js
getUserMessage() {
  if (user.isloggedIn) {
    return html`Welcome ${user.name}`;
  } else {
    return html`Please log in`;
  }
}

html`
  ${getUserMessage()}
`
```

### Repeating templates

You can use standard JavaScript constructs to create repeating templates. 

lit-html also provides some special functions, called _directives_, for use in templates. You can use the  `repeat` directive to build certain kinds of dynamic lists more efficiently.

####  Repeating templates with Array.map

To render lists, you can use `Array.map` to transform a list of data into a list of templates:

```js
html`
  <ul>
    ${items.map((item) => html`<li>${item}</li>`)}
  </ul>
`;
```

Note that this expression returns an array of `TemplateResult` objects. lit-html will render an array or iterable of subtemplates and other values.

#### Repeating templates with looping statements

You can also build an array of templates and pass it into a template binding.

```js
const itemTemplates = [];
for (const i of items) {
  itemTemplates.push(html`<li>${i}</li>`);
}

html`
  <ul>
    ${itemTemplates}
  </ul>
`;
```

#### Repeating templates with the repeat directive

In most cases, using loops or `Array.map` is an efficient way to build repeating templates. However, if you want to reorder a large list, or mutate it by adding and removing individual entries, this approach can involve recreating a large number of DOM nodes. 

The `repeat` directive can help here. Directives are special functions that provide extra control over rendering. lit-html comes with some built-in directives like `repeat`. 

The repeat directive performs efficient updates of lists based on user-supplied keys:

`repeat(items, keyFunction, itemTemplate)`

Where:

*   `items` is an Array or iterable.
*   `keyFunction` is a function that takes a single item as an argument and returns a guaranteed unique key for that item.
*   `itemTemplate` is a template function that takes the item and its current index as arguments, and returns a `TemplateResult`.

For example:

```js
import {html} from 'lit-html';
import {repeat} from 'lit-html/directives/repeat.js';

const employeeList = (employees) => html`
  <ul>
    ${repeat(employees, (employee) => employee.id, (employee, index) => html`
      <li>${index}: ${employee.familyName}, ${employee.givenName}</li>
    `)}
  </ul>
`;
```

If you re-sort the `employees` array, the `repeat` directive reorders the existing DOM nodes. 

To compare this to lit-html's default handling for lists, consider reversing a large list of names:

*   For a list created using `Array.map`, lit-html maintains the DOM nodes for the list items, but reassigns the values. 
*   For a list created using `repeat`, the `repeat` directive reorders the _existing_ DOM nodes, so the nodes representing the first list item move to the last position.

Which repeat is more efficient depends on your use case: if updating the DOM nodes is more expensive than moving them, use the repeat directive. Otherwise, use `Array.map` or looping statements.

### Rendering nothing
Sometimes, you may want to render nothing at all. The values `undefined`, `null` and the empty string (`''`) in a text binding all render an empty text node. In most cases, that's exactly what you want:

```js
import {html} from 'lit-html';
${user.isAdmin
      ? html`<button>DELETE</button>`
      : ''
  }
```

In some cases, you want to render nothing at all. In these cases, you can use the `nothing` value provided by lit-html.

```js
import {html, nothing} from 'lit-html';
${user.isAdmin
      ? html`<button>DELETE</button>`
      : nothing
  }
```

In this case, when `user.isAdmin` is false, no text node is rendered.

#### nothing and the slot fallback content

One specific use case where an empty text node causes issues is when you're using a `<slot>` element inside a shadow root. 

This use case is very specific to [shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM), and you probably won't encounter it unless you're using lit-html as part of LitElement or another web components base class.

Imagine you have a custom element, `example-element`, that has a slot in
its shadow DOM:

```js
html`<slot>Sorry, no content available. I am just fallback content</slot>`;
``` 

The slot defines fallback content for when there is no content defined to be put in the slot. 

So, extending the previous example:

```js
import {nothing, html} from 'lit-html';

html`
<example-element>${user.isAdmin
        ? html`<button>DELETE</button>`
        : nothing
      }</example-element>
`;
``` 

If the user is logged in, the Delete button is rendered. If the user is not logged in, nothing is rendered inside of `example-element`. This means the slot is empty and its fallback content "Sorry, no content available. I am just fallback content" is rendered.

Replacing `nothing` in this example with the empty string causes an empty text node to be rendered inside `example-element`, suppressing the fallback content.

**Whitespace creates text nodes.** For the example to work, the text binding inside `<example-element>` must be the **entire** contents of `<example-element>`. Any whitespace outside of the binding delimiters adds static text nodes to the template, suppressing the fallback content. However, whitespace _inside_ the binding delimiters is fine.

The two following examples show an element with extra whitespace surrounding the binding delimiters. 

```js
// Whitespace around the binding means the fallback content
// doesn't render
html`
<example-element> ${nothing} </example-element>
`;
// Line breaks count as whitespace, too
html`
<example-element>
${nothing}
</example-element>
`;
```

## Caching template results: the cache directive 

In most cases, JavaScript conditionals are all you need for conditional templates. However, if you're switching between large, complicated templates, you might want to save the cost of recreating DOM on each switch. 

In this case, you can use the `cache` _directive_. Directives are special functions that provide extra control over rendering. The cache directive caches DOM for templates that aren't being rendered currently. 

```js
import {html} from 'lit-html';
import {cache} from 'lit-html/directives/cache.js';

const detailView = (data) => html`<div>...</div>`; 
const summaryView = (data) => html`<div>...</div>`;

html`${cache(data.showDetails
  ? detailView(data) 
  : summaryView(data)
)}`
```

When lit-html re-renders a template, it only updates the modified portions: it doesn't create or remove any more DOM than it needs to. But when you switch from one template to another, lit-html needs to remove the old DOM and render a new DOM tree. 

The `cache` directive caches the generated DOM for a given binding and input template. In the example above, it would cache the DOM for both the  `summaryView` and `detailView` templates. When you switch from one view to another, lit-html just needs to swap in the cached version of the new view, and update it with the latest data.
