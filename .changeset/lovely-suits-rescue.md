---
'@lit-labs/ssr-dom-shim': patch
---

This change extends the CustomElementRegistryShim to patch localName and tagName into the web component, when calling define.
This allows instances to call `this.localName` and `this.tagName` accordingly.
