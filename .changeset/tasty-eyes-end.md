---
'@lit-labs/router': minor
---

**[BREAKING]** Router properties prefixed with an underscore have been made
private. These properties were being renamed in production builds and should not
have been exposed as part of a public API.
