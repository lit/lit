/**
 * @license
 * Copyright The Lit Project Contributors.
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const tsconfigTemplate = () => {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'es2022',
        module: 'es2022',
        lib: ['es2022', 'DOM', 'DOM.Iterable'],
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        inlineSources: true,
        outDir: './',
        rootDir: './src',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noImplicitAny: true,
        noImplicitThis: true,
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        noImplicitOverride: true,
        skipLibCheck: true,
      },
      include: ['src/**/*.ts'],
      exclude: [],
    },
    null,
    2
  );
};
