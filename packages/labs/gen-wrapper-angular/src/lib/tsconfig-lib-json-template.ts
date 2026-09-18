export const tsconfigLibTemplate = () => {
  return JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        declaration: true,
        declarationMap: true,
        inlineSources: true,
      },
      angularCompilerOptions: {
        compilationMode: 'partial',
      },
      exclude: ['**/*.spec.ts'],
    },
    null,
    2
  );
};
