# Bundle distribution

2022-01-14

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
- Avoiding including the bundles in the npm packages makes it clear that they
  aren't typically intended for npm users, who already have easy access to an
  unbundled version of the package.
