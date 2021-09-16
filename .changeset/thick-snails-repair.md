---
'lit-element': patch
'lit-html': patch
---

Fixed issue where `AsyncDirective`s could see `this.isConnected === true` if a LitElement performed its initial render while it was disconnected.
