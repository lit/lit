---
'@lit-labs/task': major
---

**[Breaking]** Task will no longer reset its `value` or `error` on pending. This allows us to start chaining tasks e.g.

```js
const a = new Task(
  this,
  async ([url]) => await fetch(url),
  () => [this.url]
);
const b = new Task(
  this,
  async ([value]) => {
    /* This is not thrashed */
  },
  () => [a.value]
);
```
