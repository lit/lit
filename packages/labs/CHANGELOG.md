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

- Adds `createContext` which can be used to create providers and consumers useful for passing data down the element tree without the need to use lit parts to connect the elements.
- Adds `UpdatingController`, a class which can interact with an `UpdatingElement` by hooking into its lifecycle, including connected, disconnected, update, updated, and requestUpdate.
- Adds `labs` package. The `labs` package is an experimental playground for Lit helpers and tools.
