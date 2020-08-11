# lit-localize

[![Published on npm](https://img.shields.io/npm/v/lit-localize.svg)](https://www.npmjs.com/package/lit-localize) [![Test Status](https://github.com/PolymerLabs/lit-localize/workflows/tests/badge.svg?branch=master)](https://github.com/PolymerLabs/lit-localize/actions?query=workflow%3Atests+branch%3Amaster+event%3Apush)

## API

The `lit-localize` module exports the following functions:

### `configureLocalization(configuration)`

Set configuration parameters for lit-localize when in runtime mode. Returns an
object with functions:

- [`getLocale`](#getLocale): Return the active locale code.
- [`setLocale`](#setLocale): Set the active locale code.

Throws if called more than once.

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
object with functions:

- [`getLocale`](#getLocale): Return the active locale code.

(Note that [`setLocale`](#setLocale) is not available, because changing locales
at runtime is not supported in transform mode.)

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

### `getLocale(): string`

Return the active locale code.

In transform mode, calls to this function are transformed into the static locale
code string for each emitted locale.

### `setLocale(locale: string)`

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

### `msg(id: string, template, ...args): string|TemplateResult`

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
