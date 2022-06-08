/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

export const tsconfigTemplate = () => {
  return JSON.stringify(
    {
      compilerOptions: {
        outDir: './',
        rootDir: './src',
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'node',
        strict: true,
        jsx: 'preserve',
        sourceMap: true,
        resolveJsonModule: true,
        isolatedModules: true,
        esModuleInterop: true,
        lib: ['esnext', 'dom'],
        useDefineForClassFields: false,
        experimentalDecorators: true,
        skipLibCheck: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noImplicitAny: true,
        noImplicitThis: true,
        noImplicitOverride: true,
        declaration: true,
        inlineSources: true,
        allowSyntheticDefaultImports: true,
      },
      include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
      references: [{path: './tsconfig.node.json'}],
      exclude: [],
    },
    null,
    2
  );
};
