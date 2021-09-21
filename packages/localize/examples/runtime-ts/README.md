# @lit/localize runtime example for TypeScript

This package demonstrates an application that uses
[@lit/localize](https://github.com/lit/lit/tree/main/packages/localize) in
runtime mode with TypeScript.

## Overview

- A simple app that renders _"Hello World"_ in 3 languages, with a drop-down
  locale picker.
- Uses runtime mode, so new locales are loaded dynamically without a page
  reload.
- Uses the `Localized` mixin to automatically re-render a `LitElement`-based
  component whenever the locale changes.
- Uses the `lit-localize-status` event to show and hide a spinner whenever a new
  locale is loading.
- Persists the locale to the `?locale=` URL parameter and supports history
  navigations.

## Setup

```bash
git clone https://github.com/lit/lit.git
cd lit/packages/localize/examples/runtime-ts
npm i
npm run build
npm run serve
```

Visit the URL that is logged to the console to view the app.
