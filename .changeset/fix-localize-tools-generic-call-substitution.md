---
'@lit/localize-tools': patch
---

Fix `parseStringAsTemplateLiteral` misparsing TypeScript generic call expressions inside `${...}` template substitutions. Previously the helper parsed template literal bodies with `ts.ScriptKind.JS`, so an expression like `${foo<T>(arg)}` was parsed as a chain of comparison operators (`(foo < T) > (arg)`) instead of a generic call. Parsing as TypeScript now correctly recognizes the type argument list and produces a `CallExpression`.
