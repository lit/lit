---
'@lit/reactive-element': major
'lit': major
'lit-element': major
---

Delete deprecated queryAssignedNodes behavior and arguments.

Migrate deprecated usage with a selector argument to use
`@queryAssignedElements`. E.g.: `@queryAssignedNodes('list', true, '.item')` to
`@queryAssignedElements({slot: '', flatten: false, selector: '.item'})`.
