---
'@lit-labs/ssr-client': patch
'lit': patch
'lit-element': patch
'lit-html': patch
'@lit/reactive-element': patch
---

Updates the `exports` field of `package.json` files to replace the [subpath
folder
mapping](https://nodejs.org/dist/latest-v16.x/docs/api/packages.html#packages_subpath_folder_mappings)
syntax with an explicit list of all exported files.

The `/`-suffixed syntax for subpath folder mapping originally used in these
files is deprecated. Rather than update to the new syntax, this change replaces
these mappings with individual entries for all exported files so that (a) users
must import using extensions and (b) bundlers or other tools that don't resolve
subpath folder mapping exactly as Node.js does won't break these packages'
expectations around how they're imported.
