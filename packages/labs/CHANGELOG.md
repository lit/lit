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

- Adds `AsyncTask`, a controller that performs an asynchronous task like a fetch and performs an update on the host element when the task completes.
- Adds `UpdatingController`, a class which can interact with an `UpdatingElement` by hooking into its lifecycle, including connected, disconnected, willUpdate, update, didUpdate, and requestUpdate.
- Adds react component wrapper for custom elements. Use by calling `createComponent` via the `frameworks/react/create-component` module.

- Adds `labs` package. The `labs` package is an experimental playground for Lit helpers and tools.
