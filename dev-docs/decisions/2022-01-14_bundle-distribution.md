# Bundle distribution

## Status

Accepted

## Context

We want to start distributing the bundled versions of Lit but incentivize users
to use the unbundled packages if possible.

## Decision

The bundles will be distributed by committing them to a new repo
(https://github.com/lit/bundles) at the same time `lit` is published to npm.

## Consequences

- The separate repo allows them to be tagged with unprefixed versions (vs.
  package-prefixed tags, e.g. `lit@2.0.0`), which is necessary for compatibility
  with jsDelivr's scheme for specifying an imprecise version when requesting a
  file from a repo on GitHub. (See https://jsdelivr.com/features for more info.)
- Not publishing on npm helps avoid the risk that users might publish a reusable
  package depending on a bundle rather than Lit source, which could lead to
  duplication of the Lit library when users install such packages alongside
  others that do correctly depend on Lit source.
