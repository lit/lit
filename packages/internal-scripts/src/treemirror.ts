/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import fastGlob from 'fast-glob';
import * as fs from 'fs/promises';
import * as pathlib from 'path';

const unreachable = (x: never) => x;

const main = async () => {
  const [, , mode, root, dest, ...globs] = process.argv;
  if (
    !(mode === 'copy' || mode === 'symlink') ||
    !root ||
    !dest ||
    globs.length === 0
  ) {
    console.error(
      `
USAGE
    treemirror copy|symlink ROOT_DIR DEST_DIR GLOB1 [GLOB2, ...]"

EXAMPLES
    To recursively symlink all "d.ts" and "d.ts.map" files in the
    "development" directory to the current directory:

        treemirror symlink development . '**/*.d.ts' '**/*.d.ts.map'
`.trim()
    );
    process.exit(1);
  }

  const matches = await fastGlob(globs, {cwd: root, absolute: true});
  const mirrors = [];
  const dirs = new Set<string>();
  for (const original of matches) {
    const mirror = pathlib.resolve(dest, pathlib.relative(root, original));
    mirrors.push({original, mirror});
    dirs.add(pathlib.dirname(mirror));
  }

  await Promise.all([...dirs].map((dir) => fs.mkdir(dir, {recursive: true})));

  if (mode === 'copy') {
    await Promise.all(
      mirrors.map(async ({original, mirror}) => {
        // Overwrites by default.
        await fs.copyFile(original, mirror);
      })
    );
  } else if (mode === 'symlink') {
    await Promise.all(
      mirrors.map(async ({original, mirror}) => {
        const relativePath = pathlib.relative(
          pathlib.dirname(mirror),
          original
        );
        try {
          await fs.symlink(relativePath, mirror);
        } catch (e) {
          if (e.code === 'EEXIST') {
            await fs.unlink(mirror);
            await fs.symlink(relativePath, mirror);
          } else {
            throw e;
          }
        }
      })
    );
  } else {
    throw new Error(`Unexpected mode ${unreachable(mode)}`);
  }
};

main();
