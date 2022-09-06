/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * Generates JSON to be patched into an angular.json file.
 */
export const angularJsonProject = (
  projectDir: string,
  projectsRoot: string
) => {
  const projectRoot = `${projectsRoot}/${projectDir}`;
  return {
    [projectDir]: {
      projectType: 'library',
      root: projectRoot,
      sourceRoot: `${projectRoot}/src`,
      prefix: 'lib',
      architect: {
        build: {
          builder: '@angular-devkit/build-angular:ng-packagr',
          options: {
            project: `${projectRoot}/ng-package.json`,
          },
          configurations: {
            production: {
              tsConfig: `${projectRoot}/tsconfig.lib.prod.json`,
            },
            development: {
              tsConfig: `${projectRoot}/tsconfig.lib.json`,
            },
          },
          defaultConfiguration: 'production',
        },
        test: {
          builder: '@angular-devkit/build-angular:karma',
          options: {
            main: `${projectRoot}/src/test.ts`,
            tsConfig: `${projectRoot}/tsconfig.spec.json`,
            karmaConfig: `${projectRoot}/karma.conf.js`,
          },
        },
      },
    },
  };
};
