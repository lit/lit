# @lit-labs/forms

Form helpers for Lit

## `FormAssociated` mixin

The `FormAssociated` mixin helps define a form-associated custom element

```ts
import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {FormAssociated, formValue} from '@lit-labs/forms';

@customElement('my-element')
export class MyElement extends FormAssociated(LitElement) {
  @formValue()
  accessor value: string | null;

  override render() {
    return html`<input .value=${this.value} />`;
  }
}
```
