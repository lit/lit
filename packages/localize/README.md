# @lit/localize

[npm-img]: https://img.shields.io/npm/v/@lit/localize
[npm-href]: https://www.npmjs.com/package/@lit/localize
[test-img]: https://github.com/lit/lit/workflows/Tests/badge.svg?branch=master
[test-href]: https://github.com/lit/lit/actions?query=workflow%3ATests+branch%3Amaster+event%3Apush

[![Published on NPM][npm-img]][npm-href]
[![Test status][test-img]][test-href]

⚠️ _Active work in progress! Subject to rapid major changes._ ⚠️

<img src="./rgb_lit.png" width="150" height="100" align="right"></img>

###### [Features](#features) | [Overview](#overview) | [Examples](#examples) | [Modes](#modes) | [Tutorial](#tutorial) | [API](#api) | [Descriptions](#descriptions) | [Status event](#lit-localize-status-event) | [@localized decorator](#localized-decorator) | [CLI](#cli) | [Config file](#config-file) | [Rollup](#rollup) | [FAQ](#faq)

> @lit/localize is a library and command-line tool for localizing web
> applications that are based on Lit.

## Features

- 🌐 Localize your Lit applications
- 🔥 Safely embed HTML markup within localized templates
- 🍦 Write vanilla JS or TS that works in development with no new tooling
- 📄 Standard XLIFF interchange format
- 🆓 Generate a zero-overhead bundle for each locale
- 🔁 ... or dynamically load locales and automatically re-render

## Overview

Wrap your template with the `msg` function to make it localizable, and decorate
your component with `@localized` to make it automatically re-render when the
locale changes:

```typescript
import {LitElement, html, customElement} from 'lit';
import {msg, localized} from '@lit/localize';

@customElement('my-element')
@localized()
class MyElement extends LitElement {
  render() {
    return msg(html`Hello <b>World</b>!`);
  }
}
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
import {html} from 'lit';

class MyElement extends LitElement {
  render() {
    return html`Hola <b>Mundo</b>!`;
  }
}
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

## Examples

Checkout the
[`examples`](https://github.com/lit/lit/tree/main/packages/localize/examples/)
directory in this repo for working examples of `@lit/localize` in 4 of the most
common configurations:

#### JavaScript

- Runtime mode: [`examples/runtime-js`](https://github.com/lit/lit/tree/main/packages/localize/examples/runtime-js)
- Transform mode: [`examples/transform-js`](https://github.com/lit/lit/tree/main/packages/localize/examples/transform-js)

#### TypeScript

- Runtime mode: [`examples/runtime-ts`](https://github.com/lit/lit/tree/main/packages/localize/examples/runtime-ts)
- Transform mode: [`examples/transform-ts`](https://github.com/lit/lit/tree/main/packages/localize/examples/transform-ts)

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

1. Install `@lit/localize` and `@lit/localize-tools`. These packages provide the
   client library and the command-line tool.

   ```bash
   npm i @lit/localize
   npm i -D @lit/localize-tools
   ```

2. Create an `index.js` or `index.ts` file, and declare a localizable template
   by wrapping a standard Lit `html` tagged string with the `msg` function:

   ```typescript
   import {LitElement, html} from 'lit';
   import {msg} from '@lit/localize';

   class MyElement extends LitElement {
     render() {
       return html`<p>${msg(html`Hello <b>World</b>!`)}</p>`;
     }
   }
   ```

   > Note this code will directly run just as it would if you were rendering the
   > Lit template directly, so any existing build process you already have
   > doesn't need to change until you want to integrate localized templates.

3. Make a JSON config file at the root of your project called
   `lit-localize.json`. In this example we're using _transform_ mode, but you
   can also use _runtime_ mode.

   ```json
   {
     "$schema": "https://raw.githubusercontent.com/lit/lit/main/packages/localize-tools/config.schema.json",
     "sourceLocale": "en",
     "targetLocales": ["es-419"],
     "inputFiles": ["**/*.js"],
     "output": {
       "mode": "transform"
     },
     "interchange": {
       "format": "xliff",
       "xliffDir": "xliff/"
     }
   }
   ```

   > Note the `$schema` property is optional, and lets
   > editors like VSCode auto-complete and check for errors.

4. Run the `lit-localize` CLI with the `extract` command:

   ```bash
   npx lit-localize extract
   ```

5. Take a look at the generated XLIFF file `xliff/es-419.xlf`. Note that we have
   a `<source>` template extracted from your source code, but we don't have a
   localized version yet. Also note that embedded HTML markup has been encoded
   into `<ph>` tags.

   ```xml
   <trans-unit id="h3c44aff2d5f5ef6b">
     <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
   </trans-unit>
   ```

6. Edit `xliff/es-419.xlf` to add a `<target>` tag containing a localized
   version of the template. Usually you would use a tool or service to generate
   this tag by feeding it this XLIFF file.

   ```xml
   <trans-unit id="h3c44aff2d5f5ef6b">
     <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
     <target>Hola <ph id="0">&lt;b></ph>Mundo<ph id="1">&lt;/b></ph>!</target>
   </trans-unit>
   ```

7. Run the `lit-localize` CLI with the `build` command:

   ```bash
   npx lit-localize build
   ```

8. Now take a look at the generated file `es-419/index.js`:

   ```javascript
   import {html, render} from 'lit';
   render(html`<p>Hola <b>Mundo</b>!</p>`, document.body);
   ```

   and `en/index.js`:

   ```javascript
   import {html, render} from 'lit';
   render(html`<p>Hello <b>World</b>!</p>`, document.body);
   ```

   Note that the localized template has been substituted into your code, the
   `msg` call has been removed, the Lit template has been reduced to its
   simplest form, and the `lit-localize` module is no longer imported.

## API

The `@lit/localize` module exports the following functions:

> Note that lit-localize relies on distinctive, annotated type signatures to
> identify calls to `msg` and other APIs during analysis of your code. Casting a
> lit-localize function to a type that does not include its annotation will
> prevent lit-localize from being able to extract and transform templates from
> your application. For example, a cast like `(msg as any)("Hello")` will not be
> identified. It is safe to re-assign lit-localize functions or pass them as
> parameters, as long as the distinctive type signature is preserved. If needed,
> you can reference each function's distinctive type with e.g. `typeof msg`.

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

### `msg(template: TemplateResult|string|StrResult, options?: {id?: string, desc?:string}) => string|TemplateResult`

Make a Lit template or string localizable.

The `options.id` parameter is an optional project-wide unique identifier for
this template. If omitted, an id will be automatically generated from the
template strings.

The `options.desc` parameter is an optional description for this message
intended to help translators understand its meaning and context.

The `template` parameter can take any of these forms:

- A Lit [`html`](https://lit-html.polymer-project.org/guide/writing-templates)
  tagged string that may contain embedded HTML and arbitrary expressions. HTML
  markup and template expressions are automatically encoded into placeholders.
  Placeholders can be seen and re-ordered by translators, but they can't be
  modified.

  ```typescript
  msg(html`Hello <b>${getUsername()}</b>!`);
  ```

- A plain string with no expressions.

  ```typescript
  msg('Hello World!');
  ```

- A `str` tagged string with arbitrary expressions. This `str` tag is required
  if your plain string has expressions, because lit-localize needs dynamic
  access to the template's `values` at runtime.

  ```typescript
  msg(str`Hello ${getUsername()}!`);
  ```

In transform mode, calls to this function are replaced with the static localized
template for each emitted locale. For example:

```typescript
html`Hola <b>${getUsername()}!</b>`;
```

### `str(strings: TemplateStringsArray, ...values: unknown[]): StrResult`

Template tag function that allows string literals containing expressions to be
localized.

### `LOCALE_STATUS_EVENT`

Name of the [`lit-localize-status`](#lit-localize-status-event) event.

## Descriptions

You can add a description to a message by setting the `desc` option. Message
descriptions help translators understand the context of each string they are
translating.

```ts
msg(html`Hello <b>World</b>!`, {
  desc: 'Greeting to everybody on homepage',
});
```

Descriptions are represented in XLIFF using `<note>` elements.

```xml
<trans-unit id="h3c44aff2d5f5ef6b">
  <note>Greeting to everybody on homepage</note>
  <source>Hello <ph id="0">&lt;b></ph>World<ph id="1">&lt;/b></ph>!</source>
</trans-unit>
```

## `@localized` decorator

If you are using [Lit](https://lit.dev), then you can use the `@localized`
decorator to automatically re-render your elements whenever the locale changes.

```typescript
import {LitElement, html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {msg, localized} from '@lit/localize';

@localized()
@customElement('my-element')
class MyElement extends LitElement {
  render() {
    // Whenever setLocale() is called, and templates for that locale have
    // finished loading, this render() function will be re-invoked.
    return html`<p>${msg(html`Hello <b>World!</b>`)}</p>`;
  }
}
```

### `updateWhenLocaleChanges`

Alternatively, if your toolchain does not support decorators, you can manually
call `updateWhenLocaleChanges` from your constructor:

```typescript
import {LitElement, html} from 'lit';
import {msg, updateWhenLocaleChanges} from '@lit/localize';

class MyElement extends LitElement {
  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  render() {
    // Whenever setLocale() is called, and templates for that locale have
    // finished loading, this render() function will be re-invoked.
    return html`<p>${msg(html`Hello <b>World!</b>`)}</p>`;
  }
}
```

In transform mode `updateWhenLocaleChanges` calls are replaced with `undefined`.

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

## CLI

### Usage

```sh
lit-localize command [--flags]
```

| Command   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extract` | Extract templates from `msg()` calls across all source files included by your `tsconfig.json`, and create or update XLIFF (`.xlf`) files containing translation requests.                                                                                                                                                                                                                                                                               |
| `build`   | Read translations and build the project according to the configured mode.<br><br>In _transform_ mode, compile your project for each locale, replacing `msg` calls with localized templates. See also the [Rollup](#rollup) section for performing this transform as part of a Rollup pipeline.<br><br>In _runtime_ mode, generate a `<locale>.js` or `<locale>.ts` file for each locale, which can be dynamically loaded by the `@lit/localize` module. |

| Flag       | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `--help`   | Display help about usage.                                                   |
| `--config` | Path to JSON [config file](#config-file). Defaults to `./lit-localize.json` |

## Config file

| Property                                 | Type                       | Description                                                                                                                                                                                                                                                                               |
| ---------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sourceLocale`                           | `string`                   | Required locale code that templates in the source code are written in.                                                                                                                                                                                                                    |
| `targetLocales`                          | `string[]`                 | Required locale codes that templates will be localized to.                                                                                                                                                                                                                                |
| `inputFiles`                             | `string[]`                 | Array of filenames or [glob](https://github.com/mrmlnc/fast-glob#pattern-syntax) patterns to extract messages from. Required unless `tsConfig` is specified. If `tsConfig` is also specified, then this field takes precedence.                                                           |
| `tsConfig`                               | `string`                   | Path to a `tsconfig.json` file that determines the source files from which messages will be extracted, and also the compiler options that will be used when building for transform mode. Required unless `inputFiles` is specified. If both are specified, `inputFiles` takes precedence. |
| `output.mode`                            | `"transform"`, `"runtime"` | What kind of output should be produced. See [modes](#modes).                                                                                                                                                                                                                              |
| `output.localeCodesModule`               | `string`                   | Optional filepath for a generated module that exports `sourceLocale`, `targetLocales`, and `allLocales` using the locale codes from your config file. Use to keep your config file and client config in sync.                                                                             |
| `interchange.format`                     | `"xliff"`, `"xlb"`         | Data format to be consumed by your localization process. Options:<br><br>- `"xliff"`: [XLIFF 1.2](http://docs.oasis-open.org/xliff/v1.2/os/xliff-core.html) XML format<br>- `"xlb"`: Google-internal XML format                                                                           |
| <h4 colspan="3">Runtime mode only</h4>   |
| `output.language`                        | `"ts"`, `"js"`             | Language for emitting generated modules. Defaults to `"ts"`.                                                                                                                                                                                                                              |
| `output.outputDir`                       | `string`                   | Output directory for generated modules. Into this directory will be generated a `<locale>.js` or `<locale>.ts` file for each `targetLocale`, each a module that exports the translations in that locale keyed by message ID.                                                              |
| <h4 colspan="3">Transform mode only</h4> |
| `output.outputDir`                       | `string`                   | Output directory for transformed projects. A subdirectory will be created for each locale within this directory, each containing a full build of the project for that locale. Required unless `tsConfig` is specified, in which case it defaults to that config's `outDir`.               |
| <h4 colspan="3">XLIFF only</h4>          |                            |
| `interchange.xliffDir`                   | `string`                   | Directory on disk to read/write `.xlf` XML files. For each target locale, the file path `"<xliffDir>/<locale>.xlf"` will be used.                                                                                                                                                         |

## Rollup

To integrate locale transformation into a [Rollup](https://rollupjs.org/)
project, import the `localeTransformers` function from
`@lit/localize-tools/lib/rollup.js`.

This function generates an array of `{locale, transformer}` objects, which you
can use in conjunction with the
[transformers](https://github.com/rollup/plugins/tree/master/packages/typescript/#transformers)
option of
[`@rollup/plugin-typescript`](https://www.npmjs.com/package/@rollup/plugin-typescript)
to generate a separate bundle for each locale.

> NOTE: This approach is only supported for _transform mode_. For runtime mode,
> run `lit-localize build` before invoking Rollup. Runtime mode generates
> TypeScript files that can be treated as normal source inputs by an existing
> build pipeline.

For example, the following `rollup.config.mjs` generates a minified bundle for
each of your locales into `./bundled/<locale>/` directories.

### TypeScript example

```js
import typescript from '@rollup/plugin-typescript';
import {localeTransformers} from '@lit/localize-tools/lib/rollup.js';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

// Config is read from ./lit-localize.json by default.
// Pass a path to read config from another location.
const locales = localeTransformers();

export default locales.map(({locale, localeTransformer}) => ({
  input: `src/index.ts`,
  plugins: [
    typescript({
      transformers: {
        before: [localeTransformer],
      },
    }),
    resolve(),
    terser(),
  ],
  output: {
    file: `bundled/${locale}/index.js`,
    format: 'es',
  },
}));
```

### JavaScript example

> Note: `@lit/localize` uses the TypeScript compiler to parse, analyze, and
> transform your source code, but it does _not_ require you to write your code
> using TypeScript. We can use `@rollup/plugin-typescript` to transform `.js`
> files with the `@lit/localize` transformer too:

```js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import summary from 'rollup-plugin-summary';
import {localeTransformers} from '@lit/localize-tools/lib/rollup.js';

// Config is read from ./lit-localize.json by default.
// Pass a path to read config from another location.
const locales = localeTransformers();

export default locales.map(({locale, localeTransformer}) => ({
  input: `src/index.js`,
  plugins: [
    typescript({
      transformers: {
        before: [localeTransformer],
      },
      // Specifies the ES version and module format to emit.
      tsconfig: 'jsconfig.json',
      // Temporary directory where transformed modules will be emitted before
      // Rollup bundles them.
      outDir: 'bundled/temp',
      // @rollup/plugin-typescript always matches only ".ts" files, regardless
      // of any settings in our jsconfig.json.
      include: ['src/**/*.js'],
    }),
    resolve(),
    terser(),
    summary({
      showMinifiedSize: false,
    }),
  ],
  output: {
    file: `bundled/${locale}/index.js`,
    format: 'es',
    sourcemap: true,
  },
}));
```

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
import {LitElement, html} from 'lit';
import {getLocale} from './localization.js';
import {allLocales} from './locale-codes.js';
import {updateWhenLocaleChanges} from '@lit/localize';

export class LocalePicker extends LitElement {
  super() {
    super();
    updateWhenLocaleChanges(this);
  }
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
