#!/bin/bash
#
# @license
# Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
# This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
# The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
# The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
# Code distributed by Google as part of the polymer project is also
# subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
#

cd $( cd "$(dirname "${BASH_SOURCE[0]}")/../.." ; pwd -P )

if [ ! -d "generator/build" ]; then
  echo "Installing/building generator (one-time)"
  pushd generator
  npm i
  npm run build
  popd
fi

echo "Generating lit-html/template-heavy"
node generator/build/index.js  -r lit-html,lit-html@tot=generator/scripts/package-versions-tot.json,lit-html@release=generator/scripts/package-versions-release.json -n template-heavy -o lit-html/template-heavy -u 10
