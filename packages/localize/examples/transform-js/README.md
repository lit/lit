# @lit/localize transform example for JavaScript

This package demonstrates an application that uses
[@lit/localize](https://github.com/lit/lit/tree/main/packages/localize) in
transform mode with JavaScript.

## Overview

- A simple app that renders _"Hello World"_ in 3 languages, with a drop-down
  locale picker.
- Uses transform mode, so new locales are loaded with a page refresh, and for
  each locale there is no rendering overhead.
- Demonstrates use of the `@lit/localize-tools/lib/rollup.js` library.
- Persists the locale to the `?locale=` URL parameter.

## Setup

```bash
git clone https://github.com/lit/lit.git
cd lit/packages/localize/examples/transform-js
npm i
npm run build
npm run serve
```

Visit the URL that is logged to the console to view the app.
