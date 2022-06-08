# @lit-labs/testing

A package containing utilities for testing Lit.

## Status

`@lit-labs/testing` is part of the [Lit
Labs](https://lit.dev/docs/libraries/labs/) set of packages - it is published in
order to get feedback on the design and not ready for production. Breaking
changes are likely to happen frequently.

## Usage

### Web Test Runner Plugin for Lit SSR

Add the plugin to your config file.

```js
// web-test-runner.config.js
import {litSsrPlugin} from '@lit-labs/testing';

export default {
  plugins: [litSsrPlugin()],
};
```

This plugin registers the `lit-ssr-render` server command utilized by the SSR
fixture functions.

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
      modules: ['./my-element.js'], // path to component definition relative to test file
      base: import.meta.url, // for resolving module path
      hydrate: false, // whether to hydrate the component after loading the document (default: true)
    });
    assert.equal(el.shadowRoot.querySelector('p').textContent, 'Hello, World!');
  });
});
```

#### `ssrNonHydratedFixture` and `ssrHydratedFixture`

Functions with the hydrate option prefilled for ease of use

Example

```js
// my-element.test.js
import {ssrNonHydratedFixture, ssrHydratedFixture} from '@lit-labs/testing';
import {html} from 'lit';
import {assert} from '@esm-bundle/chai';

for (const fixture of [ssrNonHydratedFixture, ssrHydratedFixture]) {
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

### Notes and limitations

Any `lit` imports including those for custom element definitions, **must**
follow the fixture imports so that `lit/experimental-hydrate-support.js` is
imported before it.

The fixture functions expect a Lit `TemplateResult` with a Lit element as the
top level element.
