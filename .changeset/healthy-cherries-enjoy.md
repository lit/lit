---
'@lit-labs/react': patch
---

Fixed an error that occurs when when compiling TS. The error occurs when createComponent() is not provided an event map causing instance properties to be confused with event handlers.
