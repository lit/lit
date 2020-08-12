# lit-localize

[![Published on npm](https://img.shields.io/npm/v/lit-localize.svg)](https://www.npmjs.com/package/lit-localize) [![Test Status](https://github.com/PolymerLabs/lit-localize/workflows/tests/badge.svg?branch=master)](https://github.com/PolymerLabs/lit-localize/actions?query=workflow%3Atests+branch%3Amaster+event%3Apush)

## API

The `lit-localize` module exports the following functions:

> Note that lit-localize relies on distinctive, annotated TypeScript type
> signatures to identify calls to `msg` and other APIs during analysis of your
> code. Casting a lit-localize function to a type that does not include its
> annotation will prevent lit-localize from being able to extract and transform
> templates from your application. For example, a cast like
> `(msg as any)("greeting", "Hello")` will not be identified. It is safe to
> re-assign lit-localize functions or pass them as parameters, as long as the
> distinctive type signature is preserved. If needed, you can reference each
> function's distinctive type with e.g. `typeof msg`.

### `configureLocalization(configuration)`

Set configuration parameters for lit-localize when in runtime mode. Returns an
object with functions:

- [`getLocale`](#getlocale-string): Return the active locale code.
- [`setLocale`](#setlocalelocale-string-promise): Set the active locale code.

Throws if called more than once.

When in transform mode, the lit-localize CLI will error if this function is
called. Use
[`configureTransformLocalization`](#configuretransformlocalizationconfiguration)
instead.

The `configuration` object must have the following properties:

- `sourceLocale: string`: Required locale code in which source templates in this
  project are written, and the initial active locale.

- `targetLocales: Iterable<string>`: Required locale codes that are supported by
  this project. Should not include the `sourceLocale` code.

- `loadLocale: (locale: string) => Promise<LocaleModule>`: Required function
  that returns a promise of the localized templates for the given locale code.
  For security, this function will only ever be called with a `locale` that is
  contained by `targetLocales`.

Example:

```typescript
const {getLocale, setLocale} = configureLocalization({
  sourceLocale: 'en',
  targetLocales: ['es-419', 'zh_CN'],
  loadLocale: (locale) => import(`/${locale}.js`),
});
```

### `configureTransformLocalization(configuration)`

Set configuration parameters for lit-localize when in transform mode. Returns an
object with function:

- [`getLocale`](#getlocale-string): Return the active locale code.

(Note that [`setLocale`](#setlocalelocale-string-promise) is not available from
this function, because changing locales at runtime is not supported in transform
mode.)

Throws if called more than once.

The `configuration` object must have the following properties:

- `sourceLocale: string`: Required locale code in which source templates in this
  project are written, and the active locale.

Example:

```typescript
const {getLocale} = configureLocalization({
  sourceLocale: 'en',
});
```

In transform mode, calls to this function are transformed to an object with a
`getLocale` implementation that returns the static locale code for each locale
bundle. For example:

```typescript
const {getLocale} = {getLocale: () => 'es-419'};
```

### `getLocale(): string`

Return the active locale code.

### `setLocale(locale: string): Promise`

Set the active locale code, and begin loading templates for that locale using
the `loadLocale` function that was passed to `configureLocalization`. Returns a
promise that resolves when the next locale is ready to be rendered.

Note that if a second call to `setLocale` is made while the first requested
locale is still loading, then the second call takes precedence, and the promise
returned from the first call will resolve when second locale is ready. If you
need to know whether a particular locale was loaded, check `getLocale` after the
promise resolves.

Throws if the given locale is not contained by the configured `sourceLocale` or
`targetLocales`.

### `msg(id: string, template, ...args) => string|TemplateResult`

Make a string or lit-html template localizable.

The `id` parameter is a project-wide unique identifier for this template.

The `template` parameter can have any of these types:

- A plain string with no placeholders:

  ```typescript
  msg('greeting', 'Hello World!');
  ```

- A lit-html
  [`TemplateResult`](https://lit-html.polymer-project.org/api/classes/_lit_html_.templateresult.html)
  that may contain embedded HTML:

  ```typescript
  msg('greeting', html`Hello <b>World</b>!`);
  ```

- A function that returns a [template
  literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
  string that may contain placeholders. Placeholders may only reference
  parameters of the function, which will be called with the 3rd and onwards
  parameters to `msg`.

  ```typescript
  msg('greeting', (name) => `Hello ${name}!`, getUsername());
  ```

- A function that returns a lit-html
  [`TemplateResult`](https://lit-html.polymer-project.org/api/classes/_lit_html_.templateresult.html)
  that may contain embedded HTML, and may contain placeholders. Placeholders may
  only reference parameters of the function, which will be called with the 3rd
  and onwards parameters to `msg`:

  ```typescript
  msg('greeting', (name) => html`Hello <b>${name}</b>!`, getUsername());
  ```

In transform mode, calls to this function are replaced with the static localized
template for each emitted locale. For example:

```typescript
html`Hola <b>${getUsername()}!</b>`;
```

### `LOCALE_CHANGED_EVENT: string`

Whenever the locale changes and templates have finished loading, an event by
this name (`"lit-localize-locale-changed"`) is dispatched to `window`.

You can listen for this event to know when your application should be
re-rendered following a locale change. See also the
[`Localized`](#localized-mixin) mixin, which automatically re-renders
`LitElement` classes using this event.

```typescript
import {LOCALE_CHANGED_EVENT} from 'lit-localize';

window.addEventListener(LOCALE_CHANGED_EVENT, () => {
  renderApplication();
});
```

## `Localized` mixin

If you are using [LitElement](https://lit-element.polymer-project.org/), then
you can use the `Localized`
[mixin](https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/)
from `lit-localize/localized-element.js` to ensure that your elements
automatically re-render whenever the locale changes.

```typescript
import {Localized} from 'lit-localize/localized-element.js';
import {msg} from 'lit-localize';
import {LitElement, html} from 'lit-element';

class MyElement extends Localized(LitElement) {
  render() {
    // Whenever setLocale() is called, and templates for that locale have
    // finished loading, this render() function will be re-invoked.
    return html`<p>
      ${msg('greeting', html`Hello <b>World!</b>`)}
    </p>`;
  }
}
```

In transform mode, applications of the `Localized` mixin are removed.
