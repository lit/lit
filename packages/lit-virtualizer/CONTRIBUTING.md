# Contributing

Here is an overview of the repository contents.

## Source and build

`/src` contains the source files, written in JS using ES modules.

`/src/lib/uni-virtualizer` contains the uni-virtualizer source files. They are copied over from the uni-virtual package in the parent monorepo. Uni-virtualizer will someday be its own package published to NPM. At that point, lit-virtualizer can simply refer to the `uni-virtualizer` package instead of build it into the lib directly.

`npm run build` builds uni-virtualizer into `/src/lib`, and then copies `/src` into `/`. This package is published as ES modules, leaving the responsibility of module resolution to the user. This allows the user control over package delivery, for example, leaving one the freedom to implement code splitting.

## Testing

### Integration and Unit

Karma with Mocha and Chai is used for integration and unit testing. Run `npm run test` to run these suites.

### Screenshots

Screenshot test cases live in `/test/screenshot/cases`. Each page in this directory is served and visited during screenshot testing. Since lit-virtualizer uses ES modules, each page is built with rollup before being served.

Puppeteer with Mocha and Chai is used for screenshot testing. Run `npm run test:screenshot` to run these tests. If a change to lit-virtualizer is made that affects the expected screenshots, run `npm run generate-screenshots` to regenerate them.

#### Adding a new screenshot test

1. See if any of the existing page setups can be used for your test.
2. If not, add a new directory under `/test/screenshot/cases`. Create an `index.html` and a `main.js` in it, and set up your page. Your `main.js` will be built automatically, so reference it in `index.html` as `build/build.js`
4. Add your test cases to `/test/screenshot/screenshot.js`.
5. Generate screenshots for your new page and test cases. You can easily generate new screenshots for *only your new page* by adding `.only` to your `describe` block. For example: `describe.only('lit-virtual', function() { ... }`. Then run `npm run generate-screenshots`. Don't forget to remove the `.only` after.


## Publishing

This package is published to NPM as `lit-virtualizer`. Only `lit-virtualizer.js` and `/lib` are published, along with default files such as `README.md`.

