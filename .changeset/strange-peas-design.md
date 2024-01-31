---
'@lit/react': patch
---

Wrapped components will now keep track of JSX props from previous render that were set as a property on the element, but are now missing, and set the property to `undefined`. Note, wrapped components still do not have "default props" and missing props will be treated the same as explicitly passing in `undefined`.

This fixes the previously unexpected behavior where the following JSX when first rendered with a truthy condition

```jsx
return condition ? <WrappedInput disabled /> : <WrappedInput />;
```

would leave the `disabled` property and reflected attribute to be `true` even when the condition turns falsey.
