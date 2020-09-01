---
layout: try
slug: logic
title: Logic in templates
---

In this step, you'll add a loop and a conditional to your LitElement template. 

To repeat a part of your HTML template, you can use a JavaScript expression to iterate over an array property:

```js
${this.myArray.map(item => html`<li>${item}</li>`)}
```

Similarly, to conditionally render some part of your template, you can use a JavaScript expression to examine a boolean property:

```js
${this.myBool ? html`<p>something</p>` : html`<p>something else</p>`}
```

**Starting code**

_my-element.js_

```js
{% include projects/try/logic/before/my-element.js %}
```

{% include project.html folder="try/logic/before" openFile="my-element.js" %}

1.  **Add a boolean property and an array property to your properties getter.**

    Replace the static properties getter with the following code:

    ```js
    static get properties() {
      return {
        message: { type: String },
        myBool: { type: Boolean },
        myArray: { type: Array }
      };
    }
    ```

2.  **Initialize the boolean and array properties.**

    Replace the constructor with the following code:

    ```js
    constructor() {
      super();
      this.message = 'Hello world! From my-element';
      this.myBool = true;
      this.myArray = ['an','array','of','test','data'];
    }
    ```

3.  **Add a loop to your template.**
    
    To loop over the new `myArray` property, add the following code to your template:

    ```js
    <ul>${this.myArray.map(item => html`<li>${item}</li>`)}</ul>
    ```

3.  **Add a conditional to your template.**

    To render conditionally based on the value of `myBool`, add the following code to your template:

    ```js
    ${this.myBool ?
      html`<p>Render some HTML if myBool is true</p>` :
      html`<p>Render some other HTML if myBool is false</p>`}
    ```

Here's the completed code for this step:

_my-element.js_

```js
{% include projects/try/logic/after/my-element.js %}
```

[Next: 4. Events](events)
