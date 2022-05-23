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
