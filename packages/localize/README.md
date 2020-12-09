# @lit/localize

[npm-img]: https://img.shields.io/npm/v/@lit/localize
[npm-href]: https://www.npmjs.com/package/@lit/localize
[test-img]: https://github.com/Polymer/lit-html/workflows/Tests/badge.svg?branch=master
[test-href]: https://github.com/Polymer/lit-html/actions?query=workflow%3ATests+branch%3Amaster+event%3Apush

[![Published on NPM][npm-img]][npm-href]
[![Test status][test-img]][test-href]

⚠️ _Active work in progress! Subject to rapid major changes._ ⚠️

<img src="./rgb_lit.png" width="150" height="100" align="right"></img>

###### [Features](#features) | [Overview](#overview) | [Modes](#modes) | [Tutorial](#tutorial) | [API](#api) | [Descriptions](#descriptions) | [Status event](#lit-localize-status-event) | [Localized mixin](#localized-mixin) | [CLI](#cli) | [Config file](#config-file) | [FAQ](#faq)

> @lit/localize is a library and command-line tool for localizing web
> applications that are based on lit-html and LitElement.

## Features

- 🌐 Localize your lit-html and LitElement applications
- 🔥 Safely embed HTML markup within localized templates
- 🍦 Write vanilla code that works in development with no new tooling
- 📄 Standard XLIFF interchange format
- 🆓 Generate a zero-overhead bundle for each locale
- 🔁 ... or dynamically load locales and automatically re-render

## Overview

Wrap your template with the `msg` function to make it localizable:

```typescript
import {html} from 'lit-html';
import {msg} from '@lit/localize';
render(msg(html`Hello <b>World</b>!`), document.body);
```

Run `lit-localize` to extract all localizable templates and generate an XLIFF
file, a format which is supported by many localization tools and services:

```xml
<trans-unit id="h3c44aff2d5f5ef6b">
  <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
  <!-- target tag added by your localization process -->
  <target>Hola <ph id="0">&lt;b></ph>Mundo<ph id="1">&lt;/b></ph>!</target>
</trans-unit>
```

Use _transform_ mode to generate an optimized bundle for each locale:

```javascript
import {html} from 'lit-html';
render(html`Hola <b>Mundo</b>!`, document.body);
```

Alternatively, use _runtime_ mode to dynamically switch locales without a page
reload:

```typescript
import {configureLocalization} from '@lit/localize';

const {setLocale} = configureLocalization({
  sourceLocale: 'en',
  targetLocales: ['es-419', 'zh_CN'],
  loadLocale: (locale) => import(`/locales/${locale}.js`),
});

(async () => {
  await setLocale('es-419');
  renderApplication();
})();
```

See
[`examples/transform`](https://github.com/Polymer/lit-html/tree/lit-next/packages/localize/examples/transform)
and
[`examples/runtime`](https://github.com/Polymer/lit-html/tree/lit-next/packages/localize/examples/runtime)
for full working examples.

## Modes

lit-localize supports two output modes: _transform_ and _runtime_.

|                           | Transform mode                                                                                                   | Runtime mode                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Output                    | A full build of your application for each locale, with all `msg` calls replaced with static localized templates. | A dynamically loadable template module for each target locale.                                                                                       |
| Make template localizable | `msg()`                                                                                                          | `msg()`                                                                                                                                              |
| Configure                 | (Optional)<br><br> `const {getLocale} =`<br>`configureTransformLocalization(...);`                               | `const {getLocale, setLocale} =`<br>`configureLocalization(...);`                                                                                    |
| Switch locales            | Refresh page and load a different `.js` file                                                                     | Call `setLocale()` and re-render using any of:<br><br>- `lit-localize-status` event<br>- `setLocale` promise<br>- `Localized` mixin for `LitElement` |
| Advantages                | - Fastest rendering<br>- Fewer bytes for a single locale                                                         | - Faster locale switching<br>- Fewer _marginal_ bytes when switching locales                                                                         |

## Tutorial

1. Install `@lit/localize`. You get both a client library and a command-line tool.
   You'll always use both together.

   ```bash
   npm install --save @lit/localize
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

3. Create an `index.ts`, and declare a localizable template using the `msg`
   function. The first argument is a unique identifier for this template, and
   the second is a string or lit-html template.

   (Note that this code will directly compile and run, just as it would if you
   were rendering the lit template directly, so your build process doesn't need
   to change until you want to integrate localized templates.)

   ```typescript
   import {html, render} from 'lit-html';
   import {msg} from '@lit/localize';

   render(html`<p>${msg(html`Hello <b>World</b>!`)}</p>`, document.body);
   ```

4. Make a JSON config file at the root of your project called
   `lit-localize.json`. In this example we're using _transform_ mode, but you
   can also use _runtime_ mode. The `$schema` property is optional, and lets
   editors like VSCode auto-complete and check for errors.

   ```json
   {
     "$schema": "https://raw.githubusercontent.com/Polymer/lit-html/lit-next/packages/localize/config.schema.json",
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

5. Run the `lit-localize` CLI:

   ```bash
   npx lit-localize
   ```

6. Take a look at the generated XLIFF file `xliff/es-419.xlf`. Note that we have
   a `<source>` template extracted from your source code, but we don't have a
   localized version yet. Also note that embedded HTML markup has been encoded
   into `<ph>` tags.

   ```xml
   <trans-unit id="h3c44aff2d5f5ef6b">
     <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
   </trans-unit>
   ```

7. Edit `xliff/es-419.xlf` to add a `<target>` tag containing a localized
   version of the template. Usually you would use a tool or service to generate
   this tag by feeding it this XLIFF file.

   ```xml
   <trans-unit id="h3c44aff2d5f5ef6b">
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

The `@lit/localize` module exports the following functions:

> Note that lit-localize relies on distinctive, annotated TypeScript type
> signatures to identify calls to `msg` and other APIs during analysis of your
> code. Casting a lit-localize function to a type that does not include its
> annotation will prevent lit-localize from being able to extract and transform
> templates from your application. For example, a cast like
> `(msg as any)("Hello")` will not be identified. It is safe to re-assign
> lit-localize functions or pass them as parameters, as long as the distinctive
> type signature is preserved. If needed, you can reference each function's
> distinctive type with e.g. `typeof msg`.

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

It is recommended to use the `output.localeCodesModule` config file setting to
generate a module which exports a `sourceLocale` string and `targetLocales`
array that can be passed to `configureLocalization`, to ensure that your client
remains in sync with your config file.

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

It is recommended to use the `output.localeCodesModule` config file setting to
generate a module which exports a `sourceLocale` string that can be passed to
`configureTansformLocalization`, to ensure that your client remains in sync with
your config file.

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

### `getLocale() => string`

Return the active locale code.

### `setLocale(locale: string) => Promise`

Available only in runtime mode. Set the active locale code, and begin loading
templates for that locale using the `loadLocale` function that was passed to
`configureLocalization`. Returns a promise that resolves when the next locale is
ready to be rendered.

Note that if a second call to `setLocale` is made while the first requested
locale is still loading, then the second call takes precedence, and the promise
returned from the first call will resolve when second locale is ready. If you
need to know whether a particular locale was loaded, check `getLocale` after the
promise resolves.

Throws if the given locale is not contained by the configured `sourceLocale` or
`targetLocales`.

### `msg(template: string|TemplateResult|Function, options?: {id?: string, args?: any[]}) => string|TemplateResult`

Make a string or lit-html template localizable.

The `options.id` parameter is an optional project-wide unique identifier for
this template. If omitted, an id will be automatically generated from the
template strings.

The `template` parameter can have any of these types:

- A plain string with no placeholders:

  ```typescript
  msg('Hello World!');
  ```

- A lit-html
  [`TemplateResult`](https://lit-html.polymer-project.org/api/classes/_lit_html_.templateresult.html)
  that may contain embedded HTML:

  ```typescript
  msg(html`Hello <b>World</b>!`);
  ```

- A function that returns a [template
  literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
  string that may contain placeholders. Placeholders may only reference
  parameters of the function. The function will be invoked with the
  `options.args` array as its parameters:

  ```typescript
  msg((name) => `Hello ${name}!`, {args: [getUsername()]});
  ```

- A function that returns a lit-html
  [`TemplateResult`](https://lit-html.polymer-project.org/api/classes/_lit_html_.templateresult.html)
  that may contain embedded HTML, and may contain placeholders. Placeholders may
  only reference parameters of the function. The function will be invoked with
  the `options.args` array as its parameters:

  ```typescript
  msg((name) => html`Hello <b>${name}</b>!`, {args: [getUsername()]});
  ```

In transform mode, calls to this function are replaced with the static localized
template for each emitted locale. For example:

```typescript
html`Hola <b>${getUsername()}!</b>`;
```

### `LOCALE_STATUS_EVENT`

Name of the [`lit-localize-status`](#lit-localize-status-event) event.

## Descriptions

You can add descriptions to messages using special `// msgdesc:` comments.
Message descriptions help translators understand the context of each string they
are translating.

```ts
// msgdesc: Greeting to everybody on homepage
msg(html`Hello <b>World</b>!`);
```

Descriptions are represented in XLIFF using `<note>` elements.

```xml
<trans-unit id="0h3c44aff2d5f5ef6b">
  <note>Greeting to everybody on homepage</note>
  <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
</trans-unit>
```

You can also apply a `// msgdesc:` comment to a class, function, or block, in
which case the description will apply recursively to all `msg` calls within it.
If there are multiple descriptions that apply to a `msg` call, then they are
concatenated with a forward-slash in top-down order. This can be useful for
describing the context of an entire group of messages.

```ts
// msgdesc: Homepage
class MyHomepage extends Localized(LitElement) {
  render() {
    // msgdesc: Greeting to everybody
    return msg(html`Hello <b>World</b>!`);
  }
}
```

```xml
<trans-unit id="0h3c44aff2d5f5ef6b">
  <note>Homepage / Greeting to everybody</note>
  <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
</trans-unit>
```

## `lit-localize-status` event

In runtime mode, whenever a locale change starts, finishes successfully, or
fails, lit-localize will dispatch a `lit-localize-status` event to `window`.

You can listen for this event to know when your application should be
re-rendered following a locale change. See also the
[`Localized`](#localized-mixin) mixin, which automatically re-renders
`LitElement` classes using this event.

### Event types

The `detail.status` string property tells you what kind of status change has occured,
and can be one of: `loading`, `ready`, or `error`:

#### `loading`

A new locale has started to load. The `detail` object also contains:

- `loadingLocale: string`: Code of the locale that has started loading.

A `loading` status can be followed by a `ready`, `error`, or `loading` status.

In the case that a second locale is requested before the first one finishes
loading, a new `loading` event is dispatched, and no `ready` or `error` event
will be dispatched for the first request, because it is now stale.

#### `ready`

A new locale has successfully loaded and is ready for rendering. The `detail` object also contains:

- `readyLocale: string`: Code of the locale that has successfully loaded.

A `ready` status can be followed only by a `loading` status.

#### `error`

A new locale failed to load. The `detail` object also contains the following
properties:

- `errorLocale: string`: Code of the locale that failed to load.
- `errorMessage: string`: Error message from locale load failure.

An `error` status can be followed only by a `loading` status.

### Event example

```typescript
import {LIT_LOCALIZE_STATUS} from '@lit/localize';

// Show/hide a progress indicator whenever a new locale is loading,
// and re-render the application every time a new locale successfully loads.
window.addEventListener(LIT_LOCALIZE_STATUS, (event) => {
  const spinner = document.querySelector('#spinner');
  if (event.detail.status === 'loading') {
    console.log(`Loading new locale: ${event.detail.loadingLocale}`);
    spinner.removeAttribute('hidden');
  } else if (event.detail.status === 'ready') {
    console.log(`Loaded new locale: ${event.detail.readyLocale}`);
    spinner.setAttribute('hidden', '');
    renderApplication();
  } else if (event.detail.status === 'error') {
    console.error(
      `Error loading locale ${event.detail.errorLocale}: ` +
        event.detail.errorMessage
    );
    spinner.setAttribute('hidden', '');
  }
});
```

## `Localized` mixin

If you are using [LitElement](https://lit-element.polymer-project.org/), then
you can use the `Localized`
[mixin](https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/)
from `@lit/localize/localized-element.js` to ensure that your elements
automatically re-render whenever the locale changes in runtime mode.

```typescript
import {Localized} from '@lit/localize/localized-element.js';
import {msg} from '@lit/localize';
import {LitElement, html} from 'lit-element';

class MyElement extends Localized(LitElement) {
  render() {
    // Whenever setLocale() is called, and templates for that locale have
    // finished loading, this render() function will be re-invoked.
    return html`<p>${msg(html`Hello <b>World!</b>`)}</p>`;
  }
}
```

In transform mode, applications of the `Localized` mixin are removed.

## CLI

Running the `lit-localize` command-line program does the following:

1. Reads your [config file](#config-file) according to the `--config` flag.

2. Analyzes all TypeScript files covered by your `tsconfig.json`, and discovers
   all calls to the `msg` function.

3. Creates or updates an XLIFF (`.xlf`) file for each of your target locales,
   with a `<source>` tag corresponding to each `msg` call.

4. Reads existing `<target>` tags from existing XLIFF files for each `msg` call.

5. When in _transform_ mode, compiles your TypeScript project for each locale,
   where all `msg` calls are replaced with the corresponding static, localized
   version from that locale's XLIFF file.

6. When in _runtime_ mode, generates a `<locale>.ts` file for each locale, which
   can be dynamically loaded by the `@lit/localize` module.

It takes the following flags:

| Flag       | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `--help`   | Display this list of flags.                                                 |
| `--config` | Path to JSON [config file](#config-file). Defaults to `./lit-localize.json` |

## Config file

| Property                                 | Type                       | Description                                                                                                                                                                                                                  |
| ---------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceLocale`                           | `string`                   | Required locale code that templates in the source code are written in.                                                                                                                                                       |
| `targetLocales`                          | `string[]`                 | Required locale codes that templates will be localized to.                                                                                                                                                                   |
| `tsConfig`                               | `string`                   | Path to a `tsconfig.json` file that describes the TypeScript source files from which messages will be extracted.                                                                                                             |
| `output.mode`                            | `"transform"`, `"runtime"` | What kind of output should be produced. See [modes](#modes).                                                                                                                                                                 |
| `output.localeCodesModule`               | `string`                   | Optional filepath for a generated TypeScript module that exports `sourceLocale`, `targetLocales`, and `allLocales` using the locale codes from your config file. Use to keep your config file and client config in sync.     |
| `interchange.format`                     | `"xliff"`, `"xlb"`         | Data format to be consumed by your localization process. Options:<br><br>- `"xliff"`: [XLIFF 1.2](http://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html) XML format<br>- `"xlb"`: Google-internal XML format              |
| <h4 colspan="3">Transform mode only</h4> |
| `output.outputDir`                       | `string`                   | Output directory for generated TypeScript modules. Into this directory will be generated a `<locale>.ts` for each `targetLocale`, each a TypeScript module that exports the translations in that locale keyed by message ID. |
| <h4 colspan="3">XLIFF only</h4>          |                            |
| `interchange.xliffDir`                   | `string`                   | Directory on disk to read/write `.xlf` XML files. For each target locale, the file path `"<xliffDir>/<locale>.xlf"` will be used.                                                                                            |

## FAQ

- [How should I set the initial locale in transform mode?](#how-should-i-set-the-initial-locale-in-transform-mode)
- [How should I switch locales in transform mode?](#how-should-i-switch-locales-in-transform-mode)

### How should I set the initial locale in transform mode?

In transform mode, the locale is determined simply by the JavaScript bundle you
load. How you determine which bundle to load when your page loads is up to you.

> IMPORTANT: Take care to always validate your locale codes when dynamically
> choosing a script name! The example below is safe because a script can only be
> loaded if it matches one of the fixed locale codes in the regular expression,
> but if our matching logic was less precise, it could result in bugs or attacks
> that inject insecure JavaScript.

For example, if your application's locale is reflected in the URL, you can
include an inline script in your HTML file that checks the URL and inserts the
appropriate `<script>` tag:

```html
<!DOCTYPE html>
<script>
  // If the subdomain matches one of our locale codes, load that bundle.
  // Otherwise, load the default locale bundle.
  //
  // E.g. https://es-419.example.com/
  //              ^^^^^^
  const match = window.location.href.match(
    /^https?:\/\/(es-419|zh_CN|en|es)\./
  );
  const locale = match ? match[1] : 'en';
  const script = document.createElement('script');
  script.type = 'module';
  script.src = `/${locale}.js`;
  document.head.appendChild(script);
</script>
```

Implementing logic similar to this on your _server_ so that the appropriate
script tag is statically rendered into your HTML file will usually result in the
best performance, because the browser will start downloading your script as
early as possible.

### How should I switch locales in transform mode?

In transform mode, the `setLocale` function is not available. Instead, reload
the page so that the next load will pick a different locale bundle.

For example, this `locale-picker` custom element loads a new subdomain whenever
a new locale is selected from a drop-down list:

```typescript
import {LitElement, html} from 'lit-element';
import {getLocale} from './localization.js';
import {allLocales} from './locale-codes.js';
import {Localized} from '@lit/localize/localized-element.js';

export class LocalePicker extends Localized(LitElement) {
  render() {
    return html`
      <select @change=${this.localeChanged}>
        ${allLocales.map(
          (locale) =>
            html`<option value=${locale} selected=${locale === getLocale()}>
              ${locale}
            </option>`
        )}
      </select>
    `;
  }

  localeChanged(event: Event) {
    const newLocale = (event.target as HTMLSelectElement).value;
    const newHostname = `${newLocale}.example.com`;
    const url = new URL(window.location.href);
    if (newHostname !== url.hostname) {
      url.hostname = newHostname;
      window.location.assign(url.toString());
    }
  }
}
customElements.define('locale-picker', LocalePicker);
```
