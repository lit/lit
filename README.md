# lit-localize

[![Published on npm](https://img.shields.io/npm/v/lit-localize.svg)](https://www.npmjs.com/package/lit-localize) [![Test Status](https://github.com/PolymerLabs/lit-localize/workflows/tests/badge.svg?branch=master)](https://github.com/PolymerLabs/lit-localize/actions?query=workflow%3Atests+branch%3Amaster+event%3Apush)

<img src="./rgb_lit.png" width="150" height="100" align="right"></img>

###### [API](#api) | [Tutorial](#tutorial) | [API](#api)

> lit-localize is a library and command-line tool for localizing/translating web
> applications that are based on lit-html and LitElement.

## Features

- 🌐 Localize your lit-html and LitElement applications
- 🔥 Safely embed HTML markup within localized templates
- 🍦 Write vanilla code that works in development with no new tooling
- 📄 Standard XLIFF interchange format
- 🆓 Generate a zero-overhead bundle for each locale
- 🔁 ... or dynamically load locales and automatically re-render

## Tutorial

1. Install lit-localize. You get both a client library and a command-line tool.
   You'll always use both together.

   ```bash
   npm install --save lit-localize
   ```

2. Set up a TypeScript lit-html project if you don't have one already:

   ```bash
   npm install --save lit-html
   npm install --save-dev typescript
   npx tsc --init
   ```

   You'll want these TypeScript settings:

   ```json
   "compilerOptions": {
     "target": "es2018",
     "module": "esnext",
     "moduleResolution": "node"
   }
   ```

   You'll also need this directory to exist:

   ```bash
   mkdir xliff
   ```

3. Create an `index.ts`, and declare a localizable template using the `msg`
   function. The first argument is a unique identifier for this template, and
   the second is a string or lit-html template.

   (Note that this code will directly compile and run, just as it would if you
   were rendering the lit template directly, so your build process doesn't need
   to change until you want to integrate localized templates.)

   ```typescript
   import {html, render} from 'lit-html';
   import {msg} from 'lit-localize';

   render(
     html`<p>${msg('greeting', html`Hello <b>World</b>!`)}</p>`,
     document.body
   );
   ```

4. Make a JSON config file at the root of your project called
   `lit-localize.json`. In this example we're using _transform_ mode, but you
   can also use _runtime_ mode. The `$schema` property is optional, and lets
   editors like VSCode auto-complete and check for errors.

   ```json
   {
     "$schema": "https://raw.githubusercontent.com/PolymerLabs/lit-localize/master/config.schema.json",
     "sourceLocale": "en",
     "targetLocales": ["es-419"],
     "tsConfig": "tsconfig.json",
     "output": {
       "mode": "transform"
     },
     "interchange": {
       "format": "xliff",
       "xliffDir": "xliff/"
     }
   }
   ```

5. Run the lit-localize CLI:

   ```bash
   npx lit-localize
   ```

6. Take a look at the generated XLIFF file `xliff/es-419.xlf`. Note that we have
   a `<source>` template extracted from your source code, but we don't have a
   localized version yet. Also note that embedded HTML markup has been encoded
   into `<ph>` tags.

   ```xml
   <trans-unit id="greeting">
     <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
   </trans-unit>
   ```

7. Edit `xliff/es-419.xlf` to add a `<target>` tag containing a localized
   version of the template. Usually you would use a tool or service to generate
   this tag by feeding it this XLIFF file.

   ```xml
   <trans-unit id="greeting">
     <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
     <target>Hola <ph id="0">&lt;b></ph>Mundo<ph id="1">&lt;/b></ph>!</target>
   </trans-unit>
   ```

8. Run `lit-localize` again:

   ```bash
   npx lit-localize
   ```

9. Now take a look at the generated file `es-419/index.js`:

   ```javascript
   import {html, render} from 'lit-html';
   render(html`<p>Hola <b>Mundo</b>!</p>`, document.body);
   ```

   and `en/index.js`:

   ```javascript
   import {html, render} from 'lit-html';
   render(html`<p>Hello <b>World</b>!</p>`, document.body);
   ```

   Note that the localized template has been substituted into your code, the
   `msg` call has been removed, the lit-html template has been reduced to its
   simplest form, and the `lit-localize` module is no longer imported.

## API

The `lit-localize` module exports the following functions:

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

### `getLocale() => string`

Return the active locale code.

In transform mode, calls to this function are transformed into the static locale
code string for each emitted locale.

### `setLocale(locale: string)`

Set the active locale code, and begin loading templates for that locale using
the `loadLocale` function that was passed to `configureLocalization`.

In transform mode, calls to this function are replaced with `undefined`.

### `localeReady() => Promise`

Return a promise that is resolved when the next set of templates are loaded and
available for rendering. Applications in runtime mode should always `await localeReady()` before rendering.

In transform mode, calls to this function are replaced with
`Promise.resolve(undefined)`.

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
