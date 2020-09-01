---
layout: try
slug: events
title: Events
---

In this step, you'll use lit-html's `@event` annotation to add an event listener to an element inside your template. You'll also add an event handler method to your class which will fire whenever the event occurs.

**Starting code**

_my-element.js_

```js
{% include projects/try/events/before/my-element.js %}
```

{% include project.html folder="try/events/before" openFile="my-element.js" %}
  
1.  **Add a button with an event listener to your template.**

    In my-element.js, add the following `<button>` element to your HTML template:

    ```html
    <button @click=${this.clickHandler}>Click</button>
    ```

    The binding syntax `@click=${this.clickHandler}` adds a listener for the `click` event, which calls the `clickHandler` method.

2. **Add the `clickHandler` method to your class.** 

    Add the following method to your `MyElement` class:

    ```js
    clickHandler(event) {
      console.log(event.target);
      this.myBool = !this.myBool;
    }
    ```

    The `clickHandler` method toggles the boolean property, `myBool`, which you defined in the previous step.

Here's the completed code for this step:

_my-element.js_

```js
{% include projects/try/events/after/my-element.js %}
```

[Next: 5. Style](style)
