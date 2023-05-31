---
'@lit-labs/context': patch
---

Improve type checking of `@provide` and `@consume`. We now support optional properties, and public properties should be fully type checked.

This also adds support for using `@provide` and `@consume` with protected and private fields, but be aware that due to limitations in TypeScript's experimental decorators, the connection between the context and the property can not be type checked. We'll be able to fix this when standard decorators are released (current ETA TypeScript 5.2 in August 2023), see https://github.com/lit/lit/issues/3926 for more.
