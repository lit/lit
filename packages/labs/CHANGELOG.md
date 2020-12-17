# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## [x.y.z] - YYYY-MM-DD -->
<!-- ## Unreleased -->
<!-- ### Changed -->
<!-- ### Added -->
<!-- ### Removed -->
<!-- ### Fixed -->

## [1.0.0-pre.1] - 2020-12-16

### Added

- Adds `AsyncTask` controller which can be used to perform tasks when a host element updates. When the task completes, an update is requested on the host element and it should use the task value as desired.
- Adds react component wrapper for custom elements. Use by calling `createComponent` via the `frameworks/react/create-component` module.
- Adds `labs` package. The `labs` package is an experimental playground for Lit helpers and tools.
