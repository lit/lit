/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
// This script exists to perform a one time operation of adding the "browser"
// exports field to relevant package.json files. Motivated by:
// https://github.com/lit/lit/issues/4446
//
// The script is idempotent.
//
// # Instructions
// After building the script run from monorepo root:
// `node packages/internal-scripts/bin/add-browser-exports.js`

import assert from 'assert';
import {execSync} from 'child_process';
import {readFile, writeFile} from 'fs/promises';
import {resolve, relative} from 'path';

testScriptIntegrity();

/**
 * A loose structure for what we might find in the "exports" value within a
 * `package.json` file.
 */
interface Exports {
  [path: string]: {
    types?: string;
    browser?: {
      development?: string;
      default?: string;
    };
    node?: {
      development?: string;
      default?: string;
    };
    development?: string;
    default?: string;
  };
}

const result = execSync(`find ./packages -name package.json -not -path '*/.*'`);

const packageJsonFiles = result
  .toString()
  .trim()
  .split('\n')
  .filter((filePath) => !filePath.includes('/node_modules/'))
  .filter((filePath) => !filePath.includes('/test-files/'))
  .filter((filePath) => !filePath.includes('/test-goldens/'))
  .filter((filePath) => !filePath.includes('/goldens/'));

const absolutePackageJsonFilePaths = packageJsonFiles.map((relativePath) =>
  resolve(process.cwd(), relativePath)
);

export const run = async () => {
  const [, , command] = process.argv;
  if (!validateCommand(command)) {
    console.error(
      `
USAGE
    add-browser-exports <command>

COMMANDS
    test    Ensure this script doesn't need to fix any package.json files.
    fix     Write export fixes to package.json files.
`.trim()
    );
    process.exit(1);
  }
  let hadTestFailure = false;
  const work: Promise<void>[] = [];
  for (const packageJsonPath of absolutePackageJsonFilePaths) {
    work.push(
      (async (): Promise<void> => {
        const parsedPackageJson = JSON.parse(
          await readFile(packageJsonPath, {encoding: 'utf8'})
        );
        const exports: Exports | string | undefined =
          parsedPackageJson['exports'];
        if (exports === undefined) {
          return;
        }
        // `"exports": "./index.js"` can be skipped.
        if (typeof exports === 'string') {
          return;
        }
        const {value: fixedExports, dirty} =
          optionallyAddBrowserExportCondition(exports);
        if (dirty === false) {
          return;
        }
        if (command === 'test') {
          // When testing, instead of writing to the filesystem, throw an error.
          console.log(
            `\x1b[41m[Error]\x1b[0m '${relative(
              process.cwd(),
              packageJsonPath
            )}' needs to be updated using script 'add-browser-exports'.`
          );
          hadTestFailure = true;
          return;
        }
        parsedPackageJson['exports'] = fixedExports;
        await writeFile(
          packageJsonPath,
          JSON.stringify(parsedPackageJson, null, 2) + '\n'
        );
        console.log(
          `\x1b[42m[Updated]\x1b[0m ${relative(process.cwd(), packageJsonPath)}`
        );
      })()
    );
  }

  await Promise.allSettled(work);
  if (hadTestFailure) {
    process.exit(1);
  }
};

/**
 * Given the "exports" value from a package.json config, add a "browser" export
 * condition if it is not yet present above any "node" export conditions.
 *
 * @returns new config that may contain new "browser" fields. The "dirty" flag
 *          indicates if the returned exports are different from the passed in
 *          exports.
 */
function optionallyAddBrowserExportCondition(exports: Exports): {
  value: Exports;
  dirty: boolean;
} {
  let dirty = false;
  const newExports: Exports = {};
  for (const [path, exportValue] of Object.entries(exports)) {
    if (exportValue.node === undefined || exportValue.browser !== undefined) {
      newExports[path] = exportValue;
      continue;
    }
    // If there is a node export condition defined without a browser export
    // condition above it, then add the browser export condition.
    const keyOrder = Object.keys(exportValue) as Array<
      keyof typeof exportValue
    >;
    // The order of key/value pairs in the export condition matters. Here we
    // ensure "browser" ends up directly above "node".
    const newExportObject: Exports[typeof path] = {};
    for (const key of keyOrder) {
      // Add the browser export condition above the node export condition.
      if (key === 'node') {
        dirty = true;
        const browserExports: Partial<Exports['']['browser']> = {};
        for (const nodeKey of Object.keys(exportValue.node) as Array<
          keyof typeof exportValue.node
        >) {
          const exportPath = exportValue[nodeKey];
          assert.notStrictEqual(
            exportPath,
            undefined,
            `Any key/value exports defined in a node conditional export needs a browser export. Got undefined for "exports.node.${nodeKey}".`
          );
          browserExports[nodeKey] = exportPath;
        }
        newExportObject['browser'] = browserExports;
      }
      Object.assign(newExportObject, {[key]: exportValue[key]});
    }
    newExports[path] = newExportObject;
  }
  return {value: newExports, dirty};
}

function validateCommand(mode: string): mode is 'fix' | 'test' {
  return mode === 'fix' || mode === 'test';
}

/**
 * This function contains lightweight test assertions to ensure this script
 * behaves as expected. This function will throw and prevent script execution in
 * the case where a test fails.
 */
function testScriptIntegrity() {
  /**
   * Test: Empty object remains empty.
   */
  assert.deepStrictEqual(
    optionallyAddBrowserExportCondition({}),
    {
      value: {},
      dirty: false,
    },
    'Expect empty exports to return empty exports'
  );
  /**
   * Test: node export condition generates a browser export.
   */
  assert.deepStrictEqual(
    optionallyAddBrowserExportCondition({
      '.': {
        types: './dev/path.d.ts',
        node: {
          development: './node/dev/path.js',
          default: './node/path.js',
        },
        development: './dev/path.js',
        default: './path.js',
      },
    }),
    {
      value: {
        '.': {
          types: './dev/path.d.ts',
          browser: {
            development: './dev/path.js',
            default: './path.js',
          },
          node: {
            development: './node/dev/path.js',
            default: './node/path.js',
          },
          development: './dev/path.js',
          default: './path.js',
        },
      },
      dirty: true,
    },
    `Expected browser exports to be added above the node export.`
  );

  /**
   * Test: Export with am explicit browser condition is not modified
   */
  const exportsWithBrowser = {
    '.': {
      types: './dev/path.d.ts',
      browser: {
        development: './dev/path.js',
        default: './apath.js',
      },
      node: {
        development: './node/dev/path.js',
        default: './node/path.js',
      },
      development: './dev/path.js',
      default: './path.js',
    },
  };
  assert.deepStrictEqual(
    optionallyAddBrowserExportCondition(exportsWithBrowser),
    {value: exportsWithBrowser, dirty: false},
    `Expected browser exports to be added above the node export.`
  );

  /**
   * Test: There must be top level exports for any nested node exports.
   */
  assert.throws(() =>
    optionallyAddBrowserExportCondition({
      '.': {
        node: {
          development: './node/dev/path.js',
          default: './node/path.js',
        },
        // Throws because there is no non-node exports to use for the
        // browser export condition.
      },
    })
  );
}
