#!/bin/sh

# Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
# This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
# The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
# The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
# Code distributed by Google as part of the polymer project is also
# subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

# This script copies the TypeScript source into a staging directory for Typedoc
# and removes the license header for typedoc-plugin-external-module-name.
SRC_DIR="../../src"
TMP_DIR="tmp"

rm -rf $TMP_DIR
src_dirs=`find $SRC_DIR -type d -print`
for dir in $src_dirs; do
  new_dir=`echo $dir | sed "s|$SRC_DIR|$TMP_DIR|"`
	mkdir $new_dir
done
for ts_file in `find $SRC_DIR -name "*.ts" -print`; do
  tail +14 $ts_file > `echo $ts_file | sed "s|$SRC_DIR|$TMP_DIR|"`
done
