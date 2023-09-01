---
'@lit-labs/react': patch
---

Revert custom children type added in #4142 and instead use our copy of `PropsWithoutRef` type so that `preact/compat` typing will work.
Preact users facing type errors using wrapped components should configure `"paths"` in their `tsconfig.json` so that `react` types will instead resolve to `preact/compat` as described in [Preact's TypeScript documentation](https://preactjs.com/guide/v10/typescript/#typescript-preactcompat-configuration).
Going with `preact/compat` also solves compatibility issues arising from [TypeScript >= 5.1 changing JSX tag type check](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-1.html#decoupled-type-checking-between-jsx-elements-and-jsx-tag-types).
