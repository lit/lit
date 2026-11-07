---
'@lit-labs/virtualizer': patch
---

Document the strict reference equality check applied to the `items` property (and to the `items` option of the `virtualize` directive) in both the README and the source TSDoc. Because the property uses Lit's default change detection, mutating an array in place (e.g. with `Array.prototype.reverse()`, `push()`, or `sort()`) will not trigger a re-render; callers must assign a new array. This was previously undocumented, which led to confusion such as https://github.com/lit/lit/issues/3249.

A regression test (`items-reference-equality.test.ts`) pins the documented contract.
