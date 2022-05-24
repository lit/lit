import {LitModule, PackageJson} from '@lit-labs/analyzer/lib/model.js';

export const packageJsonTemplate = (
  pkgJson: PackageJson,
  litModules: LitModule[]
) => {
  // Refinement of package.json generation ala the TODOs below tracked in
  // https://github.com/lit/lit/issues/2855

  // TODO(kschaaf): spread in/adapt other relevant fields from source
  // package.json (description, license, keywords, etc.)
  return JSON.stringify(
    {
      name: `${pkgJson.name}-vue`,
      type: 'module',
      // Use vite!
      scripts: {
        dev: 'vite',
        build: 'npm run check && npm run decl && vite build',
        check: 'vue-tsc --noEmit',
        decl: 'vue-tsc --declaration --emitDeclarationOnly',
        preview: 'vite preview',
      },
      // TODO(kschaaf): Version in lock-step with source?
      version: pkgJson.version,
      dependencies: {
        // TODO(kschaaf): make component version range configurable?
        [pkgJson.name!]: '^' + pkgJson.version!,
        vue: '^3.2.25',
        '@lit-labs/vue-utils': '^0.0.1',
      },
      devDependencies: {
        // Use typescript from source package, assuming it exists
        typescript: pkgJson?.devDependencies?.typescript ?? '^4.6.4',
        '@vitejs/plugin-vue': '^2.3.1',
        '@rollup/plugin-typescript': '^8.3.2',
        vite: '^2.9.2',
        'vue-tsc': '^0.29.8',
      },
      files: [
        ...litModules.map(({module}) =>
          module.jsPath.replace(/js$/, '{js,js.map,d.ts,d.ts.map}')
        ),
      ],
    },
    null,
    2
  );
};
