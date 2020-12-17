# lit-html 2.0 monorepo

A collection of packages related to lit-html 2.0 and LitElement 3.0 work.

This branch is currently under active development. Please see the
following links for details on the changes being made:

- [Ideas for lit-html 2.0](https://github.com/Polymer/lit-html/issues/1182)
- [Ideas for LitElement 3.0](https://github.com/Polymer/lit-element/issues/1077)
- [lit-next issues/PRs in github](https://github.com/Polymer/lit-html/issues?q=is%3Aissue+label%3Alit-next+)

## Packages

- [`lit-html`](./packages/lit-html)
- [`lit-element`](./packages/lit-element)
- [`@lit/reactive-element`](./packages/reactive-element)
- [`lit-ssr`](./packages/lit-ssr)
- [`tests`](./packages/tests)
- [`benchmarks`](./packages/benchmarks)

## Development guide

Initialize repo:

```
git clone https://github.com/Polymer/lit-html.git -b lit-next
cd lit-html
npm run install
npm run bootstrap
```

Build all packages:

```
npm run build
```

Test all packages:

```
npm run test
```

Run benchmarks for all packages:

```
npm run benchmarks
```

See individual package READMEs for details on developing for a specific package.
