# @lit-labs/testing

A package containing utilities for testing Lit components.

## Status

`@lit-labs/testing` is part of the [Lit
Labs](https://lit.dev/docs/libraries/labs/) set of packages - it is published in
order to get feedback on the design and not ready for production. Breaking
changes are likely to happen frequently.

## Overview

This package contains utilities that will be useful for testing Lit elements,
especially for ensuring your components are compatible with server-side
rendering (SSR).

These are meant to be used with [Web Test Runner
(WTR)](https://modern-web.dev/docs/test-runner/overview/). A WTR plugin and
fixture functions are provided that allow testing of components being rendered
server-side and loaded to the browser document both with and without hydration.

## Usage

### Web Test Runner Plugin for Lit SSR

This plugin registers the `lit-ssr-render` server command utilized by the SSR
fixture functions.

Add the plugin to your config file.

```js
// web-test-runner.config.js
import {litSsrPlugin} from '@lit-labs/testing';

export default {
  plugins: [litSsrPlugin()],
};
```

### Fixtures

The package exports functions that will generate fixtures by passing the
provided Lit templates to the dev server to be rendered server-side, and
added to the browser document. The Web Test Runner plugin must be added to the
config file for this to work.

#### `ssrFixture`

Example

```js
// my-element.test.js
import {ssrFixture} from '@lit-labs/testing';
import {html} from 'lit';
import {assert} from '@esm-bundle/chai';

suite('my-element', () => {
  test('is rendered server-side', async () => {
    const el = await ssrFixture(html`<my-element></my-element>`, {
      modules: ['./my-element.js'], // relative path to component definition
      base: import.meta.url, // base for resolving module path (default: test file path)
      hydrate: false, // whether to hydrate the component after loading the document (default: true)
    });
    assert.equal(el.shadowRoot.querySelector('p').textContent, 'Hello, World!');
  });
});
```

#### `csrFixture`, `ssrNonHydratedFixture`, and `ssrHydratedFixture`

`csrFixture` renders the the provided template client-side.
`ssrNonHydratedFixture` and `ssrHydratedFixture` are just `ssrFixture` with the
`hydrate` option pre-filled.

These are provided to have the same call signature so the same test code can be
repeated with different rendering methods.

Example

```js
// my-element.test.js
import {
  csrFixture,
  ssrNonHydratedFixture,
  ssrHydratedFixture,
} from '@lit-labs/testing';
import {html} from 'lit';
import {assert} from '@esm-bundle/chai';

for (const fixture of [csrFixture, ssrNonHydratedFixture, ssrHydratedFixture]) {
  suite(`my-element rendered with ${fixture.name}`, () => {
    test('renders as expected', async () => {
      const el = await fixture(html`<my-element></my-element>`, {
        modules: ['./my-element.js'],
        base: import.meta.url,
      });
      assert.equal(
        el.shadowRoot.querySelector('p').textContent,
        'Hello, World!'
      );
    });
  });
}
```

### Notes

Any `lit` imports including those for custom element definitions, **must**
follow the fixture imports so that `lit/experimental-hydrate-support.js` is
imported before it.

The fixture functions expect a Lit `TemplateResult` with a single top level
element.
