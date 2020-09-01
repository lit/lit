---
layout: try
slug: properties
title: Use properties
---

In this step, you'll declare a property for your component, initialize the property, and use the value in the component's template. 

**Starting code**

_my-element.js_

```js
{% include projects/try/properties/before/my-element.js %}
```

{% include project.html folder="try/properties/before" openFile="my-element.js" %}

1. **Declare a property.**

    In my-element.js, add the following `properties` getter to the `MyElement` class: 
    
    ```js
    static get properties() {
      return { message: { type: String } };
    }
    ```

    The code snippet above adds a string property called `message` to your element class.

2. **Initialize the property.**

    A good place to initialize property values is in your element constructor. 
        
    In my-element.js, add the following method to the `MyElement` class: 
    
    ```js
    constructor() {
      super();
      this.message = 'Hello world! From my-element';
    }
    ```

    The first line of code in the constructor (`super();`) calls the parent class constructor.

3. **Add the property to your template.**

    You can add properties to your LitElement templates with JavaScript expressions.

    In my-element.js, replace the existing `render` function with the following code:

    ```js
    render() {
      return html`
        <p>${this.message}</p>
      `;
    }
    ``` 

LitElement components update automatically when their properties change. 

Here's the completed code for this step:

_my-element.js_

```js
{% include projects/try/properties/after/my-element.js %}
```

[Next: 3. Logic](logic)
