/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const tsconfigTemplate = () => {
  return JSON.stringify(
    {
      extends: './.svelte-kit/tsconfig.json',
      compilerOptions: {
        rewriteRelativeImportExtensions: true,
        allowJs: true,
        checkJs: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        sourceMap: true,
        strict: true,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
      },
    },
    null,
    2
  );
};
