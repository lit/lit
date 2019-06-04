This is a monorepo. The following documentation is for `lit-virtualizer`, the main package.

`lit-virtualizer` is found at `packages/lit-virtualizer/`.

# lit-virtualizer\*

\* all naming TBD

`lit-virtualizer` provides tools for implementing virtual scrolling with web components.

This package provides two exports to be used alongside [LitElement](https://github.com/Polymer/lit-element/) and [lit-html](https://github.com/Polymer/lit-html/):

* `lit-virtualizer`
* `scroll`

`lit-virtualizer` is a web component built with LitElement. When writing your own LitElement component, the `lit-virtualizer` element can be easily incorporated when virtual scrolling is needed.

`scroll` is a [directive](https://lit-html.polymer-project.org/guide/creating-directives) for use with lit-html templates. `lit-virtualizer` uses this so you don't have to, but if you want to harness the power of virtual scrolling without LitElement, `scroll` is also exposed.

## lit-virtualizer

A custom element that provides virtual scrolling.

### Attributes and Properties

#### .items

type: `Array<T>`

An array of data for populating templates.

#### .template

type: `(item: <T>) => lit-html.TemplateResult`

A function that takes a data item and returns a lit-html TemplateResult. The `item` argument should be the same type as the entries of the `.items` array. `TemplateResult`s are returned by lit-html's `html` tag.

Example template:

```js
(contact) => html`<div><b>${contact.name}</b>: ${contact.phone}</div>`
```

Example usage of `.items` and `.template`:

```js
const contacts = [
  {name: 'Name 1', phone: '123 456-7890'},
  {name: 'Name 2', phone: '555 555-5555'}
]

const contactCard = (contact) => html`<div><b>${contact.name}</b>: ${contact.phone}</div>`

const virtualizer = html`<lit-virtualizer
                           .items=${contacts}
                           .template=${contactCard}>
                         </lit-virtualizer>`
```

#### .scrollTarget (optional)

type: `Element|Window`

The element that generates scroll events and defines the container viewport.

Defaults to the `lit-virtualizer` element itself.

### Complete example

Definition:

```javascript
class ContactList extends LitElement {
    static get properties() {
      return {
        data: {type: Array}
      };
    }

    constructor() {
      super();
      this.data = [];
    }

    async firstUpdated() {
      this.data = [
        {name: 'Name 1', phone: '123 456-7890'},
        {name: 'Name 2', phone: '555 555-5555'}
      ]
    }

    render() {
        return html`
            <lit-virtualizer
              .scrollTarget=${window}
              .items=${this.data}
              .template=${(contact) => html`
                <div><b>${contact.name}</b>: ${contact.phone}</div>
              `}>
            </lit-virtualizer>
        `;
    }
}

customElements.define('contact-list', ContactList);
```

Usage:

```html
<contact-list></contact-list>
```