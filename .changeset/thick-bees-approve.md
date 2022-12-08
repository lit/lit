---
'@lit-labs/ssr': major
---

Allow SSR renderers to produce asynchronous values. This is a BREAKING change.

This changes the return type of `render()` and the `ElementRenderer` render methods to be a `RenderResult`, which is an iterable of strings or Promises and nested RenderResults.

The iterable remains a sync iterable, not an async iterable. This is to support environments that require synchronous renders and because sync iterables are faster than async iterables. Since many server renders will not require async rendering, they should work in sync contexts and shouldn't pay the overhead of an async iterable.

Including Promises in the sync iterable creates a kind of hybrid sync/async iteration protocol. Consumers of RenderResults must check each value to see if it is a Promise or iterable and wait or recurse as needed.

This change introduces three new utilities to do this:

- `collectResult(result: RenderResult): Promise<string>` - an async function that joins a RenderResult into a string. It waits for Promises and recurses into nested iterables.
- `collectResultSync(result: RenderResult)` - a sync function that joins a RenderResult into a string. It recurses into nested iterables, but _throws_ when it encounters a Promise.
- `RenderResultReadable` - a Node `Readable` stream implementation that provides values from a `RenderResult`. This can be piped into a `Writable` stream, or passed to web server frameworks like Koa.
