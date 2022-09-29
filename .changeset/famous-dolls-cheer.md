---
'@lit-labs/analyzer': minor
'@lit-labs/gen-wrapper-angular': minor
'@lit-labs/gen-wrapper-react': minor
'@lit-labs/gen-wrapper-vue': minor
---

Refactored Analyzer into better fit for use in plugins. Analyzer class now takes a ts.Program, and PackageAnalyzer takes a package path and creates a program to analyze a package on the filesystem.
