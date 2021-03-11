# lit-localize runtime example

This package demonstrates an application that uses [lit-localize](https://github.com/PolymerLabs/lit-localize) in runtime mode.

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
git clone https://github.com/Polymer/lit-html.git
cd lit-html/packages/localize/examples/transform
npm install
npx lit-localize build
npx tsc
npx es-dev-server --node-resolve
```

Visit the URL that is logged to the console to view the app.
