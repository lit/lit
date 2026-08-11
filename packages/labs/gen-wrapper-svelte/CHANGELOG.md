# @lit-labs/gen-wrapper-svelte

## 0.1.0

### Minor Changes

- [#5](https://github.com/Ocean-Industries-Concept-Lab/lit/pull/5) [`75fe71cfbd667a275eaa4fee483f9843f6190a50`](https://github.com/Ocean-Industries-Concept-Lab/lit/commit/75fe71cfbd667a275eaa4fee483f9843f6190a50) Thanks [@tibnor](https://github.com/tibnor)! - Forward custom events from generated Svelte wrappers using a `forwardEvents`
  action instead of `on<event>` attributes, so events with names that are not
  valid Svelte attribute names are dispatched correctly. Reactive properties
  inherited from superclasses and mixins are now also included in the generated
  wrapper props.

### Patch Changes

- [#7](https://github.com/Ocean-Industries-Concept-Lab/lit/pull/7) [`27799674b14c095941156a1179314d9c704d24bd`](https://github.com/Ocean-Industries-Concept-Lab/lit/commit/27799674b14c095941156a1179314d9c704d24bd) Thanks [@tibnor](https://github.com/tibnor)! - Svelte wrapper generator package was published empty.

## 0.0.3

### Patch Changes

- [`844825603161df56a78721caba0252f141542563`](https://github.com/Ocean-Industries-Concept-Lab/lit/commit/844825603161df56a78721caba0252f141542563) Thanks [@tibnor](https://github.com/tibnor)! - Point `repository.url` at the Ocean-Industries-Concept-Lab fork

  npm's trusted publishing verifies the provenance bundle against
  `repository.url`, so publishing failed with E422 while it still pointed at
  `lit/lit`.

### Minor Changes

- [#3225](https://github.com/lit/lit/pull/3225) [`198da7ce`](https://github.com/lit/lit/commit/198da7ceabc944b142a666cae56ea239624cd019) - Initial release
