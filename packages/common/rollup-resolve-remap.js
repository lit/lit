/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

const pathLib = require("path");

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
module.exports = function resolveRemap({ root, remap }) {
  return {
    name: "resolve-remap",
    async resolveId(importee, importer) {
      const resolved = await this.resolve(importee, importer, {
        skipSelf: true,
      });
      if (!resolved || !resolved.id) {
        return null;
      }
      const { id: fullResolvedPath } = resolved;
      const rootRelativePath = pathLib.relative(root, fullResolvedPath);
      for (const { from, to } of remap) {
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
};
