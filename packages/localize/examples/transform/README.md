# lit-localize transform example

This package demonstrates an application that uses [lit-localize](https://github.com/PolymerLabs/lit-localize) in transform
mode.

## Overview

- A simple app that renders _"Hello World"_ in 3 languages, with a drop-down
  locale picker.
- Uses transform mode, so new locales are loaded with a page refresh, and for each locale there is no rendering overhead.
- Persists the locale to the `?locale=` URL parameter.

## Setup

```bash
git clone https://github.com/Polymer/lit-html.git
cd lit-html/packages/localize/examples/transform
npm i
npx lit-localize build
npx rollup -c
npx es-dev-server --node-resolve
```

Visit the URL that is logged to the console to view the app.
