# @lit-labs/devlog

This package consumes Lit's devlog events to visualize Lit's rendering behavior in your app.

The Lit app must be run in dev mode, and due to the additional overhead of logging and visualization it's not recommended to use this package for performance measurement directly. However, it can be useful for noticing unnecessary renders, and for better understanding how much work different operations cause.

To use it, import `@lit-labs/devlog/terminal.js` before your app's entry point, and open the browser's console.
