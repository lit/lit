---
layout: try
slug: create
title: Create a component
---

In this step, you'll fill in the gaps in the starting code to create an element class with a basic HTML template.

**Starting code**

_my-element.js_

```js
{% include projects/try/create/before/my-element.js %}
```

Click **Launch Code Editor** to edit the starting code. When you're ready to see your code in action, click **Preview**.

{% include project.html folder="try/create/before" openFile="my-element.js" %}

1.  **Import the `LitElement` base class and `html` helper function.**

    In my-element.js, replace the existing `import` statement with the following code:

    ```js
    import { LitElement, html } from 'lit-element';
    ```

2.  **Create a class for your element that extends the LitElement base class.**

    In my-element.js, replace the existing class definition with the following code:

    ```js
    class MyElement extends LitElement {
      render() {
        return html`
          <p>Hello world! From my-element</p>
        `;
      }
    }
    ```

    The `render` function defines your component's template. You must implement `render` for every LitElement component.

3.  **Register the new element with the browser.**

    In my-element.js, replace the existing call to `customElements.define()` with the following code:

    ```js
    customElements.define('my-element', MyElement);
    ```

Here's the completed code for this step:

_my-element.js_

```js
{% include projects/try/create/after/my-element.js %}
```

Your code sample should be working now. LitElement components are added to a page with simple HTML tags, like this:

```html
<my-element></my-element>
```

[Next: 2. Properties](properties)
