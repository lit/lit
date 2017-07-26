# lit-html Labs
Add-ons for lit-html

## lit-extended.ts

An example of extending lit-html via a custom `TemplateInstance` subclasses.

The `render` function exported by `lit-extended.ts` supports setting properties
and event handlers in templates:

```javascript
import {render} from '../lit-html/lib/labs/lit-extended.js';

function t = (data) => html`
  <button
      class$="${data.isPrimary ? 'primary' : 'secondary'}"
      on-click="${()=>data.onClick}">
    ${data.label}
  </button>
  <!-- property and event names are case-sensitive -->
  <my-element someProperty=${data.someProperty}></my-element>
`;
```

## repeat.ts

Implements a keyed-repeat that reuses DOM generated for items when possible.

```javascript
import {repeat} from '../lit-html/lib/labs/repeat.js';

function t = (data) => html`
  <ul>
    ${repeat(data, (d) => d.id, (d) => html`
      <li>${d.title}</li>
    `)}
  </ul>
`;
```
