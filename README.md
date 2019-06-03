# lit-virtual

(working name)

`lit-virtual` provides a tools for implementing virtual scrolling with web components.

`lit-virtual` provides two exports to be used alongside [LitElement](https://github.com/Polymer/lit-element/) and [lit-html](https://github.com/Polymer/lit-html/):

* `lit-virtual-scroller`
* `scroll`

`lit-virtual-scroller` is a web component built with LitElement. When writing your own LitElement component, `lit-virtual-scroller` can be easily incorporated when virtual scrolling is needed.

`scroll` is a [directive](https://lit-html.polymer-project.org/guide/creating-directives) for use with lit-html templates. `lit-virtual-scroller` uses this so you don't have to, but if you want advanced control over your virtual scrolling, `scroll` is also exposed.

## lit-virtual-scroller

A custom element that provides virtual scrolling.

### Attributes and Properties

#### .template

type: `(item: <T>) => lit-html.TemplateResult`

A function that takes an item and returns a lit-html TemplateResult. The `item` argument should be the same type as the entries of the `.items` array. `TemplateResult`s are returned by lit-html's `html` tag.

Here is an example template:

```js
(contact) => html`<div><b>${contact.name}</b>: ${contact.phone}</div>`
```

#### .items

type: `Array<T>`

An array of items for populating templates.

Example:

```js
const contacts = [
  {name: 'Name 1', phone: '123 456-7890'},
  {name: 'Name 2', phone: '555 555-5555'}
]

const contactCard = (contact) => html`<div><b>${contact.name}</b>: ${contact.phone}</div>`

const scroller = html`<lit-virtual-scroller
                        .items=${contacts}
                        .template=${contactCard}>
                      </lit-virtual-scroller>`
```

#### .scrollTarget (optional)

type: `Element|Window`

The element that generates scroll events and defines the container viewport.

Defaults to `window`.

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
            <lit-virtual-scroller
              layout='vertical'
              .scrollTarget=${window}
              .items=${this.data}
              .template=${(contact) => html`
                <div><b>${contact.name}</b>: ${contact.phone}</div>
              `}>
            </lit-virtual-scroller>
        `;
    }
}

customElements.define('contact-list', ContactList);
```

Usage:

```html
<contact-list></contact-list>
```