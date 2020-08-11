# lit-localize

[![Published on npm](https://img.shields.io/npm/v/lit-localize.svg)](https://www.npmjs.com/package/lit-localize) [![Test Status](https://github.com/PolymerLabs/lit-localize/workflows/tests/badge.svg?branch=master)](https://github.com/PolymerLabs/lit-localize/actions?query=workflow%3Atests+branch%3Amaster+event%3Apush)

WIP

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

Set runtime localization configuration.

In runtime mode, this function must be called once, before any calls to `msg()`.

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
configureLocalization({
  sourceLocale: 'en',
  targetLocales: ['es-419', 'zh_CN'],
  loadLocale: (locale) => import(`/${locale}.js`),
});
```

In transform mode, this function is not required, and calls to it will be
replaced with `undefined`.

### `getLocale(): string`

Return the active locale code.

In transform mode, calls to this function are transformed into the static locale
code string for each emitted locale.

### `setLocale(locale: string)`

Set the active locale code, and begin loading templates for that locale using
the `loadLocale` function that was passed to `configureLocalization`.

In transform mode, calls to this function are replaced with `undefined`.

### `localeReady(): Promise`

Return a promise that is resolved when the next set of templates are loaded and
available for rendering. Applications in runtime mode should always `await localeReady()` before rendering.

In transform mode, calls to this function are replaced with `undefined`.

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
