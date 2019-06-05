# lit-virtualizer

Lit-virtualizer provides tools for implementing virtual scrolling with lit-html and LitElement.

This package provides two main exports to be used alongside [LitElement](https://github.com/Polymer/lit-element/) and [lit-html](https://github.com/Polymer/lit-html/):

* `LitVirtualizer`: a subclass of LitElement that defines `<lit-virtualizer>`. When writing your own LitElement component, the `<lit-virtualizer>` element can be easily incorporated when virtual scrolling is needed.
* `scroll`: a [directive](https://lit-html.polymer-project.org/guide/creating-directives) for use with lit-html templates. It does the same thing, but can be used without LitElement.

## Getting Started

Get this package:

```
npm i lit-virtualizer
```

The package is shipped using [ES modules](https://developers.google.com/web/fundamentals/primers/modules). It also uses [bare specifiers](https://github.com/WICG/import-maps#bare-specifiers) to refer to other node modules such as lit-html. Shipping the package this way affords you control as a developer over your bundle delivery. For example, you could do code splitting. You will, however, have to *resolve* these module names when bundling your code.

As an example, here's how you can do module resolution with [rollup](https://rollupjs.org).

*index.html*
```html
...
<script type="module" src="build/main.js">
...
```

*src/main.js*
```js
import { LitVirtualizer } from 'lit-virtualizer';

// use <lit-virtualizer> element or LitVirtualizer class
```

Install rollup and the rollup-plugin-node-resolve plugin.
```
npm i rollup rollup-plugin-node-resolve
```

*rollup.config.js*
```js
import resolve from 'rollup-plugin-node-resolve';

export default [
  {
    input: 'src/main.js',
    output: {
      dir: 'build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]        
  }
];
```

Roll it up.
```
npx rollup --config
```

Rollup will output build/main.js, with properly resolved module names.

Other small chunks will also be present. Lit-virtualizer utilizes [dynamic imports](https://developers.google.com/web/updates/2017/11/dynamic-import) in a few places to avoid loading code unnecessarily. This allowed rollup to split the code and emit several chunks.

## Documentation

### \<lit-virtualizer\>

`<lit-virtualizer>` is a custom element that provides virtual scrolling.

### Attributes and Properties

#### property: `.items`

type: `Array<T>`

An array of data for populating templates.

#### property: `.template`

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

Defaults to the `<lit-virtualizer>` element itself.

## Complete example

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