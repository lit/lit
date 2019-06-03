import resolve from 'rollup-plugin-node-resolve';

// rollup must use output dir, not output file, because there are dynamic imports in the
// build. E.g. importing Layout1d and the conditional polyfill loading.
// PSYCH check out dat --inlineDynamicImports flag.
export default [
  {
    input: [
      'src/lit-virtual-scroller.js'
    ],
    output: {
      file: 'lit-virtual-scroller.bundled.js',
      format: 'iife'
    },
    plugins: [
      resolve(),
    ],
    inlineDynamicImports: true,
  },
  // Testing a prod build
  {
    input: [
      'src/lit-virtual-scroller.js',
      'src/repeat.js',
      'src/scroll.js',
      'uni-virtual/uni-virtual.js',
      'uni-virtual/src/layouts/Layout1d.js',
      'uni-virtual/src/layouts/Layout1dBase.js',
      'uni-virtual/src/layouts/Layout1dGrid.js',
      'uni-virtual/src/polyfillLoaders/EventTarget.js',
      'uni-virtual/src/polyfillLoaders/ResizeObserver.js',
      'uni-virtual/src/VirtualRepeater.js',
      'uni-virtual/src/VirtualScroller.js',
      'lit-element',
      'lit-html',
      'event-target-shim',
      'resize-observer-polyfill',
    ],
    output: {
      dir: 'build',
      format: 'esm'
    },
    plugins: [
      resolve(),
    ]
  }
];