# @lit-labs/scoped-registry-mixin

`UseScopedRegistry` mixin for `LitElement` that integrates with the speculative [Scoped CustomElementRegistry polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/scoped-custom-element-registry).

🚨 **Warning: Scoped Custom Element Registries is a speculative browser API that has not shipped and may change.** This mixin is provided to evaluate the spec proposal and provide feedback. **Use this feature and the polyfill in production code at your own risk.**

## Overview

The [Scoped Custom Element Registries](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Scoped-Custom-Element-Registries.md) WICG proposal introduces new APIs for scoping custom elements to ShadowRoots, such that the tagName-to-custom element class mapping is local per Shadow Root.

A speculative polyfill exists at [Scoped CustomElementRegistry polyfill](https://github.com/webcomponents/polyfills/tree/master/packages/scoped-custom-element-registry). This package introduces a `UseScopedRegistry` mixin that may be applied to `LitElement`, used in conjunction with this polyfill, to register local tag-class mappings for a given element.

## Usage

The mixin adds a declarative `static scopedElements` property for declaring the custom elements to be scoped locallay to its Shadow DOM.

Basic usage is as follows:

```js
import {LitElement, html} from 'lit';
import {UseScopedRegistry} from '@lit-labs/scoped-registry-mixin';

import {SimpleGreeting} from './simple-greeting.js';

class ScopedComponent extends UseScopedRegistry(LitElement) {
  // Elements here will be registered against the tag names provided only
  // in the shadow root for this element
  static scopedElements = {
    'simple-greeting': SimpleGreeting,
  };

  render() {
    return html` <simple-greeting
      id="greeting"
      name="scoped world"
    ></simple-greeting>`;
  }
}
```

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).
