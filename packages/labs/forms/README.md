# @lit-labs/forms

A library for building [form-associated custom
elements](https://web.dev/articles/more-capable-form-controls) with Lit.

Form-associated custom elements are web components that participate in form
submission, validation, and state restoration, just like built-in form elements.
`@lit-labs/forms` helps builds correct form-associated custom elements by
setting the proper ARIA roles, form value, disabled state, and more.

This package provides:

- [`FormControl`](#formcontrol-mixin): A class mixin that makes it easy to build
  form associated custom elements that implement the standard form control APIs.
- [`FormAssociated`](#formassociated-mixin): A lower-level class mixin that only
  helps with form association, but doesn't add any public APIs.
- [Decorators](#formvalue): Decorators for binding properties to form values and
  state.

## `FormControl` mixin

The `FormControl` mixin adds standard form-related public API properties and
methods to a custom element. It also enables the use of decorators that let
developers easily bind class fields to the form value and manage form state for
restoration.

> [!NOTE]
>
> `FormControl` extends the `FormAssociated` mixin, which handles the
> ElementInternals integration and enables the decorators, but doesn't add any
> public API to the class.
>
> It's recommendation that most developers use `FormControl` instead of
> `FormAssociated` in order to add the idiomatic API that users expect from form
> controls (like `.disabled`, `.form`, `.checkValidity()`, etc.). Use
> `FormAssociated` only if you need to implement a completely custom API
> surface.

### Example

```ts
import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {FormControl, formValue} from '@lit-labs/forms';

@customElement('simple-input')
export class SimpleInput extends FormControl(LitElement) {
  @formValue()
  accessor value = '';

  override render() {
    return html`
      <input
        .value=${this.value}
        @input=${(e: Event) =>
          (this.value = (e.target as HTMLInputElement).value)}
      />
    `;
  }
}
```

The added fields and methods mimic native form controls, providing a familiar
API:

- `form`: a readonly property that returns the associated form element.
- `labels`: a readonly property that returns the labels associated with the
  element.
- `name`: a read/write property that reflects the `name` attribute.
- `disabled`: a read/write property that reflects the `disabled` attribute.
- `validity`: a readonly property that returns the `ValidityState` of the
  element.
- `validationMessage`: a readonly property that returns the error message that
  would be shown to the user if the element was to be checked for validity.
- `willValidate`: a readonly property that returns `true` if internals's target
  element will be validated when the form is submitted. For example, disabled or
  hidden elements are not validated.
- `checkValidity()`: If the element is invalid, returns `false` and fires an
  `invalid` event.
- `reportValidity()`: Like `checkValidity()` but also shows the validation
  message to the user.

## `FormAssociated` mixin

The `FormAssociated` mixin helps define a form-associated custom element.

`FormAssociated` creates a new form-associated base class and implements a
number of best-practice behaviors for form-associated elements:

- Sets the element's ARIA role using `internals.role`.
- Updates the element's form value and state using `internals.setFormState()`.
- Saves the initial form value and state for use with form reset and restore.
- Implements form reset via `formResetCallback()`.
- Implements form state restoration via `formStateRestoreCallback()`.
- Syncs the disabled state to `internals.ariaDisabled` via
  `formDisabledCallback()`.
- Calls the element's custom validator method, `_getValidity()`, when the form
  value changes and updates `internals.setValidity()` with the result.

`FormAssociated` doesn't add any public API to the element. Its behavior can be
controlled with the decorators described below.

## Decorators

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
value will be included in the state passed to `internals.setFormValue()`.

`@formStateGetter()` and `@formStateSetter()` allow for more complex state
handling. They are applied to methods called to get or set the form state. The
`@formStateGetter()` decorated method is called to retrieve the state object to
pass to `internals.setFormValue()`. The `@formStateSetter()` decorated method is
called with the restored state object when the browser restores the element.

```ts
class CustomStateElement extends FormAssociated(LitElement) {
  @formValue()
  accessor value = 'bar';

  @formState()
  @property()
  accessor count = 0;

  @formStateGetter()
  // @ts-expect-error #getFormState is called dynamically
  #getFormState() {
    return this.value + '#' + this.count;
  }

  @formStateSetter()
  // @ts-expect-error #setFormState is called dynamically
  #setFormState(state: string) {
    const [value, count] = state.split('#');
    this.value = value;
    this.count = Number(count);
  }
}
```

> [!WARNING]
>
> TypeScript will complain that a private getter isn't called even if it's
> decorated and called by the decorator. The FormAssociated API might change so
> that it doesn't require a `@ts-expect-error` comment to suppress this warning.

## Utilities

- `isDisabled()`: An element can be disabled because its ancestor fieldset is
  disabled, so checking the `disabled` attribute is insufficient. `isDisabled()`
  checks if the element matches `:disabled`, correctly handling inherited
  disabled state.

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
