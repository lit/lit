export const ngPackageJsonTemplate = () => {
  return JSON.stringify(
    {
      $schema: 'https://json.schemastore.org/ng-package',
      dest: 'dist',
      lib: {
        entryFile: 'src/public-api.ts',
      },
      allowedNonPeerDependencies: ['.*'],
    },
    null,
    2
  );
};
