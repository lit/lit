# rollup-plugin-minify-html-literals

[![npm](https://img.shields.io/npm/v/rollup-plugin-minify-html-literals.svg)](https://www.npmjs.com/package/rollup-plugin-minify-html-literals)
[![Build Status](https://travis-ci.com/asyncLiz/rollup-plugin-minify-html-literals.svg?branch=master)](https://travis-ci.com/asyncLiz/rollup-plugin-minify-html-literals)
[![Coverage Status](https://coveralls.io/repos/github/asyncLiz/rollup-plugin-minify-html-literals/badge.svg?branch=master)](https://coveralls.io/github/asyncLiz/rollup-plugin-minify-html-literals?branch=master)

Uses [minify-html-literals](https://www.npmjs.com/package/minify-html-literals) to minify HTML and CSS markup inside JavaScript template literal strings.

## Usage

```js
import babel from 'rollup-plugin-babel';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import { uglify } from 'rollup-plugin-uglify';

export default {
  entry: 'index.js',
  dest: 'dist/index.js',
  plugins: [
    minifyHTML(),
    // Order plugin before transpilers and other minifiers
    babel(),
    uglify()
  ]
};
```

By default, this will minify any tagged template literal string whose tag contains "html" or "css" (case insensitive). [Additional options](https://www.npmjs.com/package/minify-html-literals#options) may be specified to control what templates should be minified.

## Options

```js
export default {
  entry: 'index.js',
  dest: 'dist/index.js',
  plugins: [
    minifyHTML({
      // minimatch of files to minify
      include: [],
      // minimatch of files not to minify
      exclude: [],
      // set to `true` to abort bundling on a minification error
      failOnError: false,
      // minify-html-literals options
      // https://www.npmjs.com/package/minify-html-literals#options
      options: null,

      // Advanced Options
      // Override minify-html-literals function
      minifyHTMLLiterals: null,
      // Override rollup-pluginutils filter from include/exclude
      filter: null
    })
  ]
};
```

## Examples

### Minify Polymer Templates

```js
import minifyHTML from 'rollup-plugin-minify-html-literals';
import { defaultShouldMinify } from 'minify-html-literals';

export default {
  entry: 'index.js',
  dest: 'dist/index.js',
  plugins: [
    minifyHTML({
      options: {
        shouldMinify(template) {
          return (
            defaultShouldMinify(template) ||
            template.parts.some(part => {
              // Matches Polymer templates that are not tagged
              return (
                part.text.includes('<style') ||
                part.text.includes('<dom-module')
              );
            })
          );
        }
      }
    })
  ]
};
```
