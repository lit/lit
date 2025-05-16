---
'lit-html': patch
'lit': patch
'lit-element': patch
---

Adjusted the comparison to use the name property of the \_$resolve function and the resolveOverrideFn in private ssr support to prevent duplicated patching of the directive class.
