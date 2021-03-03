/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as pathLib from 'path';

/**
 * Rollup plugin that remaps import module specifiers.
 *
 * Similar to @rollup/plugin-alias, but different in that it works better with
 * relative path module specifiers, not just bare module specifiers.
 *
 * Instead of applying substitutions directly to the original module specifier
 * as @rollup/plugin-alias does, we instead first run the standard module
 * resolver, giving us a fully qualified path to a module on disk. We then apply
 * the given substutitions to that path. This way, the paths we substitute are
 * always normalized and relative to a given root directory.
 */
export function resolveRemap({root, remap}) {
  return {
    name: 'resolve-remap',
    async resolveId(importee, importer) {
      const resolved = await this.resolve(importee, importer, {
        skipSelf: true,
      });
      if (!resolved?.id) {
        return null;
      }
      const fullResolvedPath = resolved.id;
      const rootRelativePath = pathLib.relative(root, fullResolvedPath);
      for (const {from, to} of remap) {
        if (rootRelativePath.startsWith(from)) {
          if (to == null) {
            return null;
          }
          return pathLib.join(root, rootRelativePath.replace(from, to));
        }
      }
      return null;
    },
  };
}
