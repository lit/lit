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
- Console warnings added for removed API and other element problems in developer mode. Some warnings are errors and are always issued while others are optional: making changes in update warns by default and can be toggled via `MyElement.disabledWarnings.add('change-in-update)`; special migration warnings are off by default and can be toggled via `MyElement.disabledWarnings.delete('migration')`.
