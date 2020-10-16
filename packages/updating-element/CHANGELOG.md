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

## Unreleased

### Added

- UpdatingElement moved from `lit-element` package to `updating-element` package.

### Fixed

- Fixes an issue with `queryAssignedNodes` when applying a selector on a slot that included text nodes on older browsers not supporting Element.matches [#1088](https://github.com/Polymer/lit-element/issues/1088).
