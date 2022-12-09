# Lit Examples

This folder contains example projects showcasing usage of `lit` and `@lit-labs`
packages in various contexts, including integrations with other frameworks.

The purpose for these projects includes serving as demonstration or example for
packages in the monorepo, as well as testing to make sure the packages continue
to work in these contexts, and to assist in developing new integrations.

The example projects are deliberately not included in the NPM Workspaces for the
monorepo for the following reasons:

- `npm ci` from the monorepo root will not install dependencies for these
  examples.
- The dependencies stay within each project's `node_modules` directory and
  doesn't get hoisted to the root `node_modules` which can be problematic for
  some framework code like Next.js, or when examples depend on specific versions
  of dependencies that are also used elsewhere in the monorepo.
- Packages internal to the monorepo can still be referenced by file path like
  `"lit": "file:../packages/lit"`

Note: For manually testing changes to any package via the example project, the
recommended way of installing dependencies within the example project is to do
it with the [install-links]
(https://docs.npmjs.com/cli/v9/commands/npm-install#install-links) option set to
false. This is the default behavior for npm v8. However, if you're using npm v9,
you can set it by running `npm i --install-links=false` within the example
project directory. This will create a symlink, rather than packing and installed
into `node_modules` which is useful for rapidly making changes to the internal
package and seeing its effects in the example project without having to
reinstall.
