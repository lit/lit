# @lit-labs/forms

Form helpers for Lit

## `FormAssociated` mixin

The `FormAssociated` mixin helps define a form-associated custom element.

`FormAssociated` creates a new form-associated base class and implements a
number of best-practice behaviors for form-associated elements:

- Sets the element's ARIA role using `internals.role`.
- Updates the element's form value and state using `internals.setFormState()`.
- Saves the initial form value and state.
- Implements form reset via `formResetCallback()`.
- Implements form state restoration via `formStateRestoreCallback()`.
- Syncs the disabled state to `internals.ariaDisabled` via
  `formDisabledCallback()`.
- Calls the element's custom validator method, `_getValidity()`, when the form
  value changes and updates `internals.setValidity()` with the result.

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

`FormAssociated` doesn't add any public API to the element. Its behavior can be
controlled with a few decorators.

### `@formValue()`

The form value can be stored in any class field decorated with `@formValue`.

```ts
  @formValue()
  accessor value = '';
```

By default, the field must be of type `string | File | FormData | null`.
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

Form state is additional data stored by the browser alongside the form value.
While the form _value_ is what gets submitted to the server, the form _state_ is
used to restore the element's user interface when the user navigates back or
forward, or when the browser restores a session.

The underlying browser API is `ElementInternals.setFormValue(value, state)`. The
`FormAssociated` mixin automatically calls this method whenever the `@formValue`
property changes. If you provide form state, it is passed as the second
argument.

When the browser restores the element, `FormAssociated` receives the stored
state and uses it to reset the element's properties.

To provide this state, you can use the `@formState` decorator on a property, or
`@formStateGetter` and `@formStateSetter` on methods.

The `@formState()` decorator marks a field as being part of the form state. Its
value will be included in the state passed to `setFormValue`.

`@formStateGetter()` and `@formStateSetter()` allow for more complex state
handling. They are applied to a getter and setter. The getter is called to
retrieve the state object to pass to `setFormValue`. The setter is called with
the restored state object when the browser restores the element.

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

The added fields and methods mimic native form controls, providing a familiar
and compatible API:

- `form`: a readonly property that returns the associated form element.
- `disabled`: a read/write property that reflects the `disabled` attribute.
- `validity`: a readonly property that returns the `ValidityState` of the
  element.
- `validationMessage`: a readonly property that returns the error message that
  would be shown to the user if the element was to be checked for validity.
- `willValidate`: a readonly property that returns true if internals's target
  element will be validated when the form is submitted. For example, disabled
  or hidden elements are not validated.
- `checkValidity()`: If the element is invalid, returns `false` and fires an
  `invalid` event.
- `reportValidity()`: Like `checkValidity()` but also shows the validation
  message to the user.

## Utilities

- `isDisabled()`: An element can be disabled because its ancestor fieldset is
  disabled, so checking the `disabled` attribute is insufficient. `isDisabled()`
  checks if the element matches `:disabled`, correctly handling inherited
  disabled state.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
