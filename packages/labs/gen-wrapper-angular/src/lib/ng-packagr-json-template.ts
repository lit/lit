export const ngPackagrJsonTemplate = () => {
  return JSON.stringify(
    {
      $schema: './node_modules/ng-packagr/ng-package.schema.json',
      dest: 'dist',
      lib: {
        entryFile: 'src/public-api.ts',
      },
    },
    null,
    2
  );
};
