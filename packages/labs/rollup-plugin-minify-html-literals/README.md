# @lit-labs/rollup-plugin-minify-html-literals

A Rollup plugin to minify HTML and CSS markup inside JavaScript template literal strings.

This plugin uses [html-minifier-next](https://www.npmjs.com/package/html-minifier-next) (a maintained continuation of html-minifier) for HTML minification and [lightningcss](https://lightningcss.dev/) for CSS minification, providing excellent support for modern CSS features including nesting, container queries, and more.

## Usage

```js
import babel from 'rollup-plugin-babel';
import minifyHTML from '@lit-labs/rollup-plugin-minify-html-literals';
import {uglify} from 'rollup-plugin-uglify';

export default {
  entry: 'index.js',
  dest: 'dist/index.js',
  plugins: [
    minifyHTML(),
    // Order plugin before transpilers and other minifiers
    babel(),
    uglify(),
  ],
};
```

By default, this will minify any tagged template literal string whose tag contains "html" or "css" (case insensitive). [Additional options](#options) may be specified to control what templates should be minified.

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
      options: {
        // html-minifier options
        minifyOptions: {
          minifyCSS: false, // Disable CSS minification
          // OR pass LightningCSS options for CSS minification
          minifyCSS: {
            minify: true, // Enable minification (default)
            // Browser targets for CSS feature transpilation
            // Use bit-shift notation: version << 16
            targets: {
              chrome: 95 << 16,
              firefox: 90 << 16,
              safari: 14 << 16,
            },
            // Enable draft CSS features
            drafts: {
              customMedia: true,
            },
          },
        },
        // Custom strategy for minification (optional)
      },

      // Advanced Options
      // Override minify-html-literals function
      minifyHTMLLiterals: null,
      // Override rollup-pluginutils filter from include/exclude
      filter: null,
    }),
  ],
};
```

## Examples

### Minify Polymer Templates

```js
import minifyHTML from '@lit-labs/rollup-plugin-minify-html-literals';
import {defaultShouldMinify} from '@lit-labs/rollup-plugin-minify-html-literals/lib/minify-html-literals.js';

export default {
  entry: 'index.js',
  dest: 'dist/index.js',
  plugins: [
    minifyHTML({
      options: {
        shouldMinify(template) {
          return (
            defaultShouldMinify(template) ||
            template.parts.some((part) => {
              // Matches Polymer templates that are not tagged
              return (
                part.text.includes('<style') ||
                part.text.includes('<dom-module')
              );
            })
          );
        },
      },
    }),
  ],
};
```

# Acknowledgements

This is a combination and continuation of three previous projects:

1. [rollup-plugin-minify-html-literals](https://github.com/asyncLiz/rollup-plugin-minify-html-literals)
2. [minify html literals](https://github.com/asyncLiz/minify-html-literals)
3. [parse literals](https://github.com/asyncLiz/parse-literals)
