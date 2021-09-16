# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## Unreleased -->

## 1.0.1

### Fixed

- Fixed `Cannot read properties of undefined (reading 'elements')` exception
  that would be thrown if a file imported a Lit decorator, and also included a
  default import from any package.

## 1.0.0

- Initial release of `@lit/ts-transformers`.
