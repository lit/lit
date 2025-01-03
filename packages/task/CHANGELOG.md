# Change Log

## 1.0.2

### Patch Changes

- [#4836](https://github.com/lit/lit/pull/4836) [`05691ba4`](https://github.com/lit/lit/commit/05691ba4848f1bcbec06df7dcd63ee024589ed47) Thanks [@maxpatiiuk](https://github.com/maxpatiiuk)! - Improve type inference of tuples returned by the args function being used as task function parameter.

## 1.0.1

### Patch Changes

- [#4552](https://github.com/lit/lit/pull/4552) [`4050cac6`](https://github.com/lit/lit/commit/4050cac64e39870eb0257d2ab8f72f3e43b92077) Thanks [@jrencz](https://github.com/jrencz)! - Make `status` of Task a readonly property

  So far `status` was writable which allowed for setting status of task form outside. Doing so did cause rendering of
  expected template but the task was becoming internally incoherent.

  Now attempt to assign `status` will end up in throwing a `TypeError`.

## 1.0.0

### Major Changes

- [#4170](https://github.com/lit/lit/pull/4170) [`04c8d65a`](https://github.com/lit/lit/commit/04c8d65ad8dd82c239fc04c478e36eed4d8694c4) - Graduate @lit-labs/task to @lit/task, its permanent location. @lit-labs/task is now just a proxy for @lit/task, so code need not be duplicated in projects that depend on both.

## 1.0.0-pre.0

### Major Changes

- [#4170](https://github.com/lit/lit/pull/4170) [`04c8d65a`](https://github.com/lit/lit/commit/04c8d65ad8dd82c239fc04c478e36eed4d8694c4) - Graduate @lit-labs/task to @lit/task, its permanent location. @lit-labs/task is now just a proxy for @lit/task, so code need not be duplicated in projects that depend on both.

### Patch Changes

- Updated dependencies [[`6b515e43`](https://github.com/lit/lit/commit/6b515e43c3a24cc8a593247d3aa72d81bcc724d5), [`0f6878dc`](https://github.com/lit/lit/commit/0f6878dc45fd95bbeb8750f277349c1392e2b3ad), [`2a01471a`](https://github.com/lit/lit/commit/2a01471a5f65fe34bad11e1099281811b8d0f79b), [`2eba6997`](https://github.com/lit/lit/commit/2eba69974c9e130e7483f44f9daca308345497d5), [`d27a77ec`](https://github.com/lit/lit/commit/d27a77ec3d3999e872df9218a2b07f90f22eb417), [`6470807f`](https://github.com/lit/lit/commit/6470807f3a0981f9d418cb26f05969912455d148), [`09949234`](https://github.com/lit/lit/commit/09949234445388d51bfb4ee24ff28a4c9f82fe17)]:
  - @lit/reactive-element@2.0.0-pre.1

## 1.0.0

## Initial release!

@lit/task graduated from its previous location at @lit-labs/task.

For details on its changelog before graduating, see https://github.com/lit/lit/blob/main/packages/labs/task/CHANGELOG.md
