# @lit-labs/gen-wrapper-svelte

## 0.2.0

### Minor Changes

- [#13](https://github.com/Ocean-Industries-Concept-Lab/lit/pull/13) [`146348a25a1bb6d62b540346cfc3d9ae67b560a0`](https://github.com/Ocean-Industries-Concept-Lab/lit/commit/146348a25a1bb6d62b540346cfc3d9ae67b560a0) Thanks [@jon-daeh](https://github.com/jon-daeh)! - Render parameterized slots whose names the element computes.

  A slot documented as `@slot cell-<key>-<row>-icon` gets a snippet rendered once
  per entry of the element's `cellIconSlots` property when the element also
  documents a `cell-icon-slots-change` event: the slot name without its
  placeholders names both. The wrapper reads the list on mount and on every change
  event, and keys each `NamedSlot` by the entry's `name`. The names can depend on
  element state and hold any number of placeholders, which the loop over a
  consumer prop cannot express. A matching collection prop still takes
  precedence. The snippet argument is typed from the event's `detail` entries.

## 0.1.1

### Patch Changes

- [`c91ea6cbccec99d3b630c5deb5caa61aa9a72c9d`](https://github.com/Ocean-Industries-Concept-Lab/lit/commit/c91ea6cbccec99d3b630c5deb5caa61aa9a72c9d) Thanks [@ulrik-jo](https://github.com/ulrik-jo)! - Fix the generated `.gitignore` and per-module export files.
  - `.gitignore` now ignores `.svelte-kit/`, `dist/` and `node_modules/`. It was
    copied from the Vue generator and listed paths like `/lib/ElementA.svelte.*`,
    which don't exist in a Svelte package.
  - When one source module declares several elements, the file re-exporting them
    is now written next to the wrappers in `src/lib` with one export per line.
    Previously it landed outside `src/lib`, where its `./` imports didn't
    resolve, and the exports were joined with a literal `/n`.

- [`230271a09f408b2d4f3ccbf0b8296a25a71c8ce2`](https://github.com/Ocean-Industries-Concept-Lab/lit/commit/230271a09f408b2d4f3ccbf0b8296a25a71c8ce2) Thanks [@ulrik-jo](https://github.com/ulrik-jo)! - Render named slot content natively in generated Svelte wrappers.

  Wrappers used to project named-slot snippets through a `<div slot="…">`, which
  broke percentage sizing and the component's `::slotted()` rules. Generated
  packages now include a shared `NamedSlot` component that renders the snippet
  directly into the custom element and sets `slot` on its top-level elements. It
  falls back to a `display: contents` wrapper only when the snippet renders text.

- [`30c42b3471fe16b02b81762fa3ae352ea3898db3`](https://github.com/Ocean-Industries-Concept-Lab/lit/commit/30c42b3471fe16b02b81762fa3ae352ea3898db3) Thanks [@ulrik-jo](https://github.com/ulrik-jo)! - Fix broken `src/lib/index.ts` exports for elements in subfolders when generating on Windows.

  The module's source directory was used with Windows path separators, so the
  generated re-export read `'.\sub/ElementSub.svelte'`, which JavaScript
  evaluates to `.sub/ElementSub.svelte`.

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
