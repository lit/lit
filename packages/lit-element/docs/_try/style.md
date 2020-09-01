---
layout: try
slug: style
title: Styling
---

Style your component with CSS by defining a static `styles` getter in your class.

**Starting code**

_my-element.js_

```js
{% include projects/try/style/before/my-element.js %}
```

{% include project.html folder="try/style/before" openFile="my-element.js" %}

1.  **Import the `css` helper function.**

    In my-element.js, replace the `import` statement with the following code:

    ```js
    import { LitElement, html, css } from 'lit-element';
    ```

2.  **Define your styles.**

    To define your styles, add a static `styles` getter to your class:

    ```js
    static get styles() {
      return css`
        p {
          font-family: Roboto;
          font-size: 16px;
          font-weight: 500;
        }
        .red {
          color: red;
        }
        .blue {
          color: blue;
        }
      `;
    }
    ```

3. **Apply your styles.**

    Use `myBool` to apply the styles conditionally. Add the following paragraph to your template:

    ```html
    <p class="${this.myBool ? 'red' : 'blue' }">styled paragraph</p>
    ```

Here's the completed code for this step:

_my-element.js_

```js
{% include projects/try/style/after/my-element.js %}
```

Congratulations - you've made your first element with LitElement. Next, see the [Getting&nbsp;Started](/guide/start) guide and set up LitElement locally.
