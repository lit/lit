---
'@lit-labs/ssr-react': minor
'@lit-labs/react': minor
---

`@lit-labs/ssr-react` and `@lit-labs/react` now coordinate prop handling during server rendering and hydration.

- [Breaking] `@lit-labs/ssr-react` will call `setAttribute()` with all props provided during server rendering unless they are provided in `_$litProps$` object made by `@lit-labs/react`. Previously, it would call `setProperty()` for props that were found in the element's prototype, and `setAttribute()` for those that weren't. If you wish to server render custom elements that take properties that can not be set as attributes (i.e. not serializeable or have different name as attribute/property), you must use `@lit-labs/react` to create a React wrapper component.
- `@lit-labs/react` now has a Node build and export condition to do special prop handling during server rendering. It detects the presence of `React.createElement` monkey patch by `@lit-labs/ssr-react` and provides props to be set as properties to the `createElement()` call.
- `@lit-labs/ssr-react` will add the `defer-hydration` attribute to custom elements that had properties set so that `@lit-labs/react` wrapped elements have a chance to set properties on the element before Lit element hydration is triggered.
- `@lit-labs/react` wrapped components will suppress hydration warnings raised by React due to server rendered attributes.
