---
'@oicl-lit/gen-wrapper-svelte': minor
---

Forward custom events from generated Svelte wrappers using a `forwardEvents`
action instead of `on<event>` attributes, so events with names that are not
valid Svelte attribute names are dispatched correctly. Reactive properties
inherited from superclasses and mixins are now also included in the generated
wrapper props.
