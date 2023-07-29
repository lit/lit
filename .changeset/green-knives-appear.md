---
'@lit-labs/react': major
---

- [BREAKING] Removed deprecated call signature for `createComponent()` taking multiple arguments. A single option object must be passed in instead.

Example:

```diff
- createComponent(React, 'my-element', MyElement, {onfoo: 'foo'})
+ createComponent({
+   react: React,
+   tagName: 'my-element',
+   elementClass: MyElement,
+   events: {onfoo: 'foo'},
+ })
```

- Refactored to move implementation directly into render function of `forwardRef` rather than creating a class component. This removes an extra React component of the same name showing up in the component tree.
