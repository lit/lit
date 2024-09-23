# @lit-labs/forms

Form helpers for Lit

## `FormAssociated` mixin

The `FormAssociated` mixin helps define a form-associated custom element.

`FormAssociated` creates a new form-associated base class and implements a
number of best-practice behaviors for form associated elements:

- Sets the element's ARIA role with `internals.role`.
- Sets the element's form value and state with `internals.setFormState()`.
- Saves the initial form value and state.
- Implements form reset with the `formResetCallback()`.
- Implements form state restoration with the `formStateRestoreCallback()`.
- Syncs disability state to `internals.ariaDisabled` with the
  `formDisabledCallback()`.
- Calls the element's custom validator method, `_getValidity()`, when the form
  value changes and calls `internals.setValidity()` with the result.

### Example

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

### `@formValue()`

The form value can be stored in any field, decorated with the `@formValue`
decorator.

```ts
  @formValue()
  accessor value = '';
```

By default, the field has to have the type of `string | File | FormData | null`.
If your element has a value of a different type, you can use a custom form value
converter:

```ts
  @formValue({
    converter: {
      toFormValue(value: number) {
        return String(value);
      },
      fromFormValue(value: string) {
        return Number(value);
      },
    },
  })
  accessor value = 23;
```

### `@formStateGetter()`, `@formStateSetter()`, and `@formState()`

Form state is an additional object that can be stored with a form that
represents state that is not neccessarily part of the value and submitted with
the form. If elements have additional state, they should pass it when setting
form values and they should be able to derive a value from state.

To enable this two decorators are provided to read and write form state:
`@formStateGetter()` and `@formStateSetter()`. They are applied to a getter and
setter to mark them as beind use to readn adn write state. When present,
FormAssociated will use them when setting a value and restoring the form.

The `@formState()` decorator marks a field as being part of the form state so
that the state is stored with the form and validation is performed.

```ts
class CustomStateElement extends FormAssociated(LitElement) {
  @formValue()
  accessor value = 'bar';

  @formState()
  @property()
  accessor count = 0;

  @formStateGetter()
  // @ts-expect-error #formState is called dynamically
  get #formState() {
    return this.value + '#' + this.count;
  }

  @formStateSetter()
  set #formState(state: string) {
    const [value, count] = state.split('#');
    this.value = value;
    this.count = Number(count);
  }
}
```

> [!WARNING]
>
> TypeScript will complain that a private getter isn't called even if
> it's decorated and called by the decorator. The FormAssociated API might
> change so that it doesn't require a `@ts-expect-error` comment to suppress
> this warning.

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

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
