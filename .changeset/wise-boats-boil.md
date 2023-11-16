---
'@lit-labs/ssr-client': minor
'@lit-labs/ssr': minor
---

Add `ServerController` interface which extends reactive controllers. Any _server only_ async SSR work can now be executed by defining a `serverUpdateComplete` field on a reactive controller. When SSRing a LitElement, its shadow contents will only render after all attached server controller's promises have resolved.

This enables advanced use-cases, such as awaiting a server only dynamic import and running bespoke _server only_ logic hooked to a reactive controller. This controller has access to its hosts properties.
