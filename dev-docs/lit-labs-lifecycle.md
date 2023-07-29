# Lit Labs Lifecycle

## Introduction

This document outlines guidelines for advancing "labs" packages through a lifecycle from exploration to production.

## Background / Motivation

During development of Lit 2.0, we consciously chose to add a "labs" designation for packages in the monorepo to designate packages that are not at a production-level of quality or support. Source for labs packages are under the `packages/labs` folder in the monorepo, and are published to npm under a `@lit-labs` npm organization.

The impetus for a formal "labs" designation stemmed from a desire to balance a tension between (a) the need to publish exploratory code to npm in order to get real-world feedback on new product ideas, and (b) setting expectations around quality/support for those packages, given that user feedback may drive significant changes or cause reconsideration for the product conception altogether.

However, the aim is that once a labs package has reached a certain level of maturity, it will shed its "labs" status and graduate to a fully supported product (moving out of the labs folder in the monorepo and being published to the `@lit` npm org). This document is a guideline for advancing a labs package through a series of phases from exploration to production.

## Overview

This process seeks to ensure we have reasonably positive answers to the following questions before graduating a package from labs to "production".

1. Have enough users tried the package and given positive feedback?
2. Are all major known bugs resolved?
3. Is the API considered reasonably stable?
4. Do we have a plan to dedicate sufficient resources to support production users of the package?

To this end, a labs package will go through three phases:

- **Proposal**: Labs packages are cheaper to maintain than full production packages, but they are not free. Since introducing the [Lit RFC process](https://github.com/lit/rfcs/blob/main/rfcs/0001-rfc-process.md) we encourage all new labs packages to be proposed via an RFC.

- **Development**: Code is starting to be checked in, but is not yet ready for consumption/feedback. We may publish pre-releases to npm where useful for development, but code won't otherwise be promoted or obviously discoverable.

- **Evaluation**: Releases are published to npm under `@lit-labs` for evaluation purposes. README has sufficient documentation to explain usage suitable for evaluation. The [labs page on lit.dev](https://lit.dev/docs/libraries/labs/) describes the package and solicits for feedback from a specific discussion thread. Feedback via discussions & issues may drive frequent breaking changes.

- **Production**: Release considered stable, published to npm under `@lit` org, and has dedicated docs page(s) and API documentation on lit.dev. Bugs and feature requests will be triaged and prioritized at the same level as other core packages. Breaking changes may happen, but should be minimized to the extent possible.

### Phase summary

<table>
  <tr>
    <th>Phase:</th>
    <th>Development</th>
    <th>Evaluation</th>
    <th>Production</th>
  </tr>
  <tr>
    <th>
      External usage expectation
    </th>
    <td>
      None. Code is under development and not suitable for 3rd-party usage.
    </td>
    <td>
      Code is published but recommended for evaluation purposes only.
    </td>
    <td>
      Code is recommended for use in production.
    </td>
  </tr>
  <tr>
    <th>
      Source location
    </th>
    <td colspan="2">

`packages/labs/{name}`

  </td>    
  <td>

`packages/{name}`

  </td>
  </tr>
  <tr>
    <th>npm package</th>
    <td colspan="2">

`@lit-labs/{name}`

  </td>
  <td>

`@lit/{name}`

  </td>
  </tr>
  <tr>
    <th>Version</th>
    <td colspan="2">
      By convention, < 0.x (but may be any)
    </td>
    <td>
      Starts at 1.0
    </td>
  </tr>
  <tr>
    <th>Docs</th>
    <td>
      README
    </td>
    <td>

Referenced on [lit.dev/docs/libraries/labs/](https://lit.dev/docs/libraries/labs/)

  </td>
  <td>Full docs on lit.dev</td>
  </tr>
  <tr>
    <th>
      Promotion
    </th>
    <td>
      None
    </td>
    <td>
      Limited promotion with a focus on driving feedback into discussions/issues.
    </td>
    <td>
      Promotion via content/social channels.
    </td>
  </tr>
  <tr>
    <th>
      Requirements for next phase
    </th>
    <td style="vertical-align: top">

- Docs: README suitable for evaluation usage. Addition to lit.dev labs page drafted.
- Feedback channel: Discussion thread opened for feedback.

  </td>
  <td style="vertical-align: top">

- Feedback review: confirmed usage and positive feedback
- Bug review: major known issues resolved.
- API review: API considered stable.
- Support commitment: Leads agree on resourcing for production-level support.
- Docs: Docs page drafted and ready for publishing.

    </td>

    <td>
    </td>
  </tr>

</table>

### Gathering feedback

To try to ensure that we have good feedback on a package before graduating it, we explicitly solicit feedback via dedicated GitHub discussions threads in the ["Labs Feedback"](https://github.com/lit/lit/discussions/categories/labs-feedback) category. The feedback discussions must be linked to from the lit.dev labs page.

### Graduation review

Given that most labs packages going forward will be associated with an RFC, and packages that are candidates for graduation will have exposure within the team, we want the graduation process to be lightweight.

To graduate to evaluation or production, add an agenda item to the Lit Eng meeting, or open an issue, with the following information:

#### For Development → Evaluation:

- **Readiness Summary**: Discussion and confirmation that we are ready to start soliciting feedback on the package.
- **Docs Review**: Link to PR with addition to the lit.dev labs table.

Once approved, the GitHub Discussion should be started, and labs page should be published pointing to the README and Discussion links. Social channels can begin soliciting for feedback.

#### For Evaluation → Production:

- **Feedback Summary**: Summary of feedback from discussion thread indicating non-trivial usage and positive feedback.
- **Issue Summary**: Summary of outstanding known issues / feature requests and why these shouldn't block release.
- **API Summary**: Discussion of API stability, particularly if/how planned improvements can be made additively to the API to avoid planned breaking changes.
- **Support Plan**: What the expected support burden will be, and who will be responsible for handling incoming bugs and feature requests.
- **Docs Review**: Link to PR with draft documentation demonstrating how the product/feature will be covered on the lit.dev site.

Once approved, a non-labs version can be published, along with merging the docs additions and promoting the release via social channels.

### Graduating a package on npm

1. Make a new package in the monorepo at `packages/{name}`

   1. Copy the source from `packages/labs/{name}` and update all the places that reference labs
   2. Remove any deprecated APIs. You should not have to remove or change non-deprecated APIs. If there's a specific reason to do so, make sure you point this out in the review. If there are any breaking changes made at this point they must be reflected in the final version of the labs package published.
   3. Update the version to `1.0.0`, regardless of what the version of the labs package is.

2. Update the labs package to re-export the production package

   In order to reduce code duplication, we will re-export the production package from the labs package. Labs users will get the production code on their next npm upgrade, and can start updating their imports one-by-one.

   1. Each module in the labs package must re-export the corresponding module in the production package.
   2. Ideally, each symbol is re-exported along with an `@deprecated` jsdoc so that tools and IDEs will show the deprecation message and guide users to the production package.
   3. Deprecate the npm package in `package.json`
   4. If the production package had any breaking changes from the labs package, mark the labs package as a major in changesets.

3. Update lit.dev

   1. Remove labs labels, icons and warnings from lit.dev docs
   2. Update the labs page to mark the package as graduated

4. Cleanup GitHub

   1. Close the feedback discussion. If there are remaining open items, open issues for them.
   2. Update the titles of any open issues to remove the labs prefix.

5. Promotion

   Graduation is a big deal, make sure we tell people about it!

   1. Write a lit.dev blog post
   2. Consider a release day and a small talk
   3. Tweet about it
   4. Tell Discord
   5. Consider adding a banner to lit.dev
