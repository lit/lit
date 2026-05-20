---
'@lit/context': patch
---

Expose `Options` types for the `ContextConsumer` and `ContextProvider`
controllers from `@lit/context` as `ContextConsumerOptions` and
`ContextProviderOptions` respectively.

These types were already publicly reachable via the
`new ContextConsumer(host, options)` and `new ContextProvider(host, options)`
constructor signatures but could not be referenced from user code (e.g.
when wrapping the controllers), because `ConstructorParameters<…>` does
not see through the deprecated constructor overload. Exposing them
under distinct names avoids the collision between the two same-named
`Options` interfaces in their source modules while keeping the existing
public API unchanged.
