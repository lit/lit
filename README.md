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
- [`lit-element-starter-ts`](./packages/lit-element-starter-ts)
- [`lit-element-starter-js`](./packages/lit-element-starter-js)
- [`@lit/reactive-element`](./packages/reactive-element)
- [`lit-ssr`](./packages/lit-ssr)
- [`labs`](./packages/labs)
- [`localize`](./packages/localize)
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

### Exporting starter templates

Although we maintain `lit-element-starter-ts` and `lit-element-starter-js` in
the monorepo for ease of integration testing, the source is exported back out to
individual repos ([ts](https://github.com/PolymerLabs/lit-element-starter-ts),
[js](https://github.com/PolymerLabs/lit-element-starter-js)) as these are
[GitHub Template Repositories](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/creating-a-template-repository)
with a nice workflow for users to create their own new element repos based on
the template.

Use the following command to export new commits to the monorepo packages to a
branch on the template repos (`lit-next` branch shown in example):

```bash
# Export TS template
git remote add lit-element-starter-ts git@github.com:PolymerLabs/lit-element-starter-ts.git
git subtree push --prefix=packages/lit-element-starter-ts/ lit-element-starter-ts lit-next
# Export JS template
git remote add lit-element-starter-js git@github.com:PolymerLabs/lit-element-starter-js.git
git subtree push --prefix=packages/lit-element-starter-js/ lit-element-starter-js lit-next
```

Notes:

- If your version of git did not come with `git-subtree`, you can add it by cloning the git source at `git@github.com:git/git.git` and symlinking `git/contrib/subtree/git-subtree` into your path (e.g. `/usr/local/bin`)
- If `git subtree` errors with a segmentation fault, try increasing your stack size prior to running, e.g. `ulimit -s 16384`
