---
'@lit-labs/react': patch
---

Only add `suppressHydrationWarning` prop when rendered in the client. This will prevent `suppresshydrationwarning` attribute being added to the host element when using `@lit-labs/ssr-react`.
