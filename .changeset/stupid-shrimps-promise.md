---
'@lit-labs/analyzer': minor
'@lit-labs/cli': minor
'@lit-labs/gen-manifest': minor
---

Added CLI improvements:

- Print diagnostic errors more gracefully to CLI)
- Add support for --exclude options (important for excluding test files from e.g. manifest or wrapper generation)

Added more analysis support and manifest emit:

- TS enum type variables
- description, summary, and deprecated for all models
- module-level description & summary
- ClassField and ClassMethod
