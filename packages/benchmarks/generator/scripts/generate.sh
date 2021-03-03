#!/bin/bash

# Copyright 2020 Google LLC
# SPDX-License-Identifier: BSD-3-Clause

cd $( cd "$(dirname "${BASH_SOURCE[0]}")/../.." ; pwd -P )

if [ ! -d "generator/build" ]; then
  echo "Installing/building generator (one-time)"
  pushd generator
  npm i
  npm run build
  popd
fi

echo "Generating lit-html/template-heavy"
node generator/build/index.js  -r lit-html,lit-html@tot=generator/scripts/package-versions-tot.json,lit-html@release=generator/scripts/package-versions-release.json -n template-heavy -o lit-html/template-heavy -u 10 -q -m render,update -g
