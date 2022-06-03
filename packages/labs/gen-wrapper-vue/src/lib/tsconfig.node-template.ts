/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const tsconfigNodeTemplate = () => {
  return JSON.stringify(
    {
      compilerOptions: {
        composite: true,
        module: 'esnext',
        moduleResolution: 'node',
      },
      include: ['vite.config.ts'],
    },
    null,
    2
  );
};
