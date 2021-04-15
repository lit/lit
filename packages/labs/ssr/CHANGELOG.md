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

- Added `render-global` module for non-sandboxed rendering.

- Added `elementRenderers` option to `RenderInfo`, along with `static matchesClass()` and `static matchesInstance()` methods to `ElementRenderer`, allowing the default renderer(s) to be overridden.

- Added `defer-hydration` attribute handling, which helps coordinate ordered wakeup of custom elements during hydration.
