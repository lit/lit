# @lit-labs/forms

Form helpers for Lit

## `FormAssociated` mixin

The `FormAssociated` mixin helps define a form-associated custom element.

`FormAssociated` creates a new class that sets `static formAssociated` to `true`
and implements a number of best-practice behaviors for form associated elements:

- Sets the element's ARIA role with `internals.role`.
- Sets the element's form value and state with `internals.setFormState()`.
- Saves the initial form value and state.
- Implements form reset with the `formResetCallback()`.
- Implements form state restoration with the `formStateRestoreCallback()`.
- Syncs disability state to `internals.ariaDisabled` with the
  `formDisabledCallback()`.
- Calls the element's custom validator method, `_getValidity()`, when the form
  value changes and calls `internals.setValidity()` with the result.

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

`FormAssociated` doesn't add any public API to the element. It's behavior can be
controlled with a few decorators.

The form value can be stored in any field, decorated with the `@formValue`
decorator. The field has to have the type of `string | File | FormData | null`

## `FormControl` mixin

The `FormControl` mixin extends the `FormAssociated` mixin to add new
form-related public API.

The fields and methods added are similar to native form controls, so that the
element will have a familiar and more compatible API:

- `form`: a readonly property that returns the associated form element.
- `disabled`: a read/write property that reflects the `disabled` attribute.
- `validity`: a readonly property that returns the `ValidityState` of the
  element.
- `validationMessage`: a readonly property that returns the error message that
  would be shown to the user if the element was to be checked for validity.
- `willValidate`: a readonly property that returns true if internals's target
  element will be validated when the form is submitted. For example, disbabled
  or hidden elements are not validated.
- `checkValidity()`: If the element is invalid, returns `false` and fires an
  `invalid` event.
- `reportValidity()`: Like `checkValidity()` but also shows the validation
  message to the user.

## Utilities

- `getInternals()`: returns the `ElementInternals` instance for the element.
  `ElementInternals` are supposed to be accessible only to the element itself,
  so `element.attachInternals()` throws if called multiple times and can't be
  used by both a base class and subclass. Since `FormAssociated` calls
  `element.attachInternals()`, it must provide another way for subclasses to get
  internals. `getInternals()` requires the element class as a parameter and is
  guarded against multiple calls similar to `attachInternals()`.

- `isDisabled()`: An element can be disabled because ti's fieldset is disabled,
  so checking the `disabled` attribute is insufficient. `isDisabled()` is a
  simple alias for `element.matches(':disabled')` which returns true when the
  browser understands an element to be disabled.
