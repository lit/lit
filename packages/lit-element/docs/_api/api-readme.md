# LitElement API Documentation

## Modules

### [lit-element](/api/modules/_lit_element_.html)

The main LitElement module, which defines the [`LitElement`](/api/classes/_lit_element_.litelement.html) base class and related APIs.

LitElement components can define a template and a set of observed properties. Changing an observed property triggers a re-render of the element.

Import [`LitElement`](/api/classes/_lit_element_.litelement.html) and [`html`](https://lit-element.polymer-project.org/api/modules/_lit_element_.html#html) from this module to create a component:

```js
import {LitElement, html} from 'lit-element';

class MyElement extends LitElement {

  // Declare observed properties
  static get properties() {
    return {
      adjective: {}
    }
  }
 
  constructor() {
    this.adjective = 'awesome';
  }

  // Define the element's template
  render() {
    return html`<p>your ${adjective} template here</p>`;
  }
}

customElements.define('my-element', MyElement);
```

`LitElement` extends [`UpdatingElement`](/api/classes/_lib_updating_element_.updatingelement.html) and adds lit-html templating.

### [lit-element/lib/updating-element.js](/api/modules/_lib_updating_element_.html)

```js
import {UpdatingElement} from 'lit-element/lib/updating-element.js';
```

Custom Element base class that supports declaring observable properties, reflecting attributes to properties, and the core update lifecycle methods.

If you want to build a custom element base class that includes these features but **not** lit-html templating, extend `UpdatingElement`.
