#!/usr/bin/env bash

# Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
# This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
# The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
# The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
# Code distributed by Google as part of the polymer project is also
# subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

set -e

alias npx="npx --no-install"

# Make sure everything builds at least once before we start watching. Otherwise
# with a clean state we'll get some errors (e.g. no TypeScript files for rollup
# to initially process, no tests to initially run).
npm run build

npx concurrently \
  -n "tsc,rollup,test" \
  -c "red,yellow,blue" \
  "npx tsc --watch --preserveWatchOutput --noEmitOnError" \
  "npx rollup -c --watch" \
  "npx chokidar --debounce=3000 'development/**/*.js' -c 'npm run test:dev && npm run test:prod'" \

# TODO: wtr will error with "Cannot run watch mode in a non-interactive (TTY)
# terminal" when we use the --watch flag from a script. We should file a bug,
# since this should be a valid use-case, but in the meantime we'll just use
# chokidar directly to trigger new tests ourselves.