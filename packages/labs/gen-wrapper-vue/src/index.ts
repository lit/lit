/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  getLitModules,
  LitElementDeclaration,
  LitModule,
  ReactiveProperty as ModelProperty,
  Event as ModelEvent,
  Package,
  PackageJson,
} from '@lit-labs/analyzer/lib/model.js';
import {javascript, FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

export const generateVueWrapper = async (
  analysis: Package
): Promise<FileTree> => {
  const litModules: LitModule[] = getLitModules(analysis);
  if (litModules.length > 0) {
    const vuePkgName = packageNameToVuePackageName(analysis.packageJson.name!);
    return {
      [vuePkgName]: {
        '.gitignore': gitIgnoreTemplate(litModules),
        'package.json': packageJsonTemplate(analysis.packageJson, litModules),
        'tsconfig.json': tsconfigTemplate(),
        ...wrapperFiles(analysis.packageJson, litModules),
      },
    };
  } else {
    throw new Error('No Lit components were found in this package.');
  }
};

const wrapperFiles = (packageJson: PackageJson, litModules: LitModule[]) => {
  const wrapperFiles: FileTree = {};
  for (const {
    module: {sourcePath, jsPath},
    elements,
  } of litModules) {
    wrapperFiles[sourcePath] = wrapperModuleTemplate(
      packageJson,
      jsPath,
      elements
    );
  }
  return wrapperFiles;
};

const packageJsonTemplate = (pkgJson: PackageJson, litModules: LitModule[]) => {
  // Refinement of package.json generation ala the TODOs below tracked in
  // https://github.com/lit/lit/issues/2855

  // TODO(kschaaf): spread in/adapt other relevant fields from source
  // package.json (description, license, keywords, etc.)
  return JSON.stringify(
    {
      name: packageNameToVuePackageName(pkgJson.name!),
      type: 'module',
      scripts: {
        build: 'tsc',
        'build:watch': 'tsc --watch',
      },
      // TODO(kschaaf): Version in lock-step with source?
      version: pkgJson.version,
      dependencies: {
        // TODO(kschaaf): make component version range configurable?
        [pkgJson.name!]: '^' + pkgJson.version!,
      },
      peerDependencies: {
        vue: '^3.2.0',
      },
      devDependencies: {
        // Use typescript from source package, assuming it exists
        typescript: pkgJson?.devDependencies?.typescript ?? '~4.3.5',
      },
      files: [...litModules.map(({module}) => module.jsPath)],
    },
    null,
    2
  );
};

const gitIgnoreTemplate = (litModules: LitModule[]) => {
  return litModules.map(({module}) => module.jsPath).join('\n');
};

const tsconfigTemplate = () => {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'es2019',
        module: 'es2015',
        lib: ['es2020', 'DOM', 'DOM.Iterable'],
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
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        noImplicitOverride: true,
      },
      include: ['src/**/*.ts'],
      exclude: [],
    },
    null,
    2
  );
};

const wrapperModuleTemplate = (
  packageJson: PackageJson,
  moduleJsPath: string,
  elements: LitElementDeclaration[]
) => {
  return javascript`
  import { h, defineComponent, openBlock, createBlock } from "vue";
  import { wrapSlots, Slots, eventProp } from "./vue-wrapper-utils";
${elements.map(
  (element) => javascript`
import {${element.name} as ${element.name}Element} from '${packageJson.name}/${moduleJsPath}';
`
)}

${elements.map((element) => wrapperTemplate(element))}
`;
};

// TODO(kschaaf): Should this be configurable?
const packageNameToVuePackageName = (pkgName: string) => `${pkgName}-vue`;

const eventNameToCallbackName = (eventName: string) =>
  'on' +
  eventName[0].toUpperCase() +
  eventName.slice(1).replace(/-[a-z]/g, (m) => m[1].toUpperCase());

const wrapProps = (props: Map<string, ModelProperty>) =>
  Array.from(props.values())
    .map((prop) => `${prop.name}: {type: ${prop.type}, required: false}`)
    .join(',\n');

// TODO(sorvell): Improve event handling, currently just forwarding the event,
// but this should be its "payload."
const wrapEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `${eventNameToCallbackName(event.name)}: eventProp<(event: ${
          event.typeString
        }) => void>()`
    )
    .join(',\n');

const renderEvents = (events: Map<string, ModelEvent>) =>
  Array.from(events.values())
    .map(
      (event) =>
        `${eventNameToCallbackName(event.name)}: (event: ${
          event.typeString
        }) => emit(event.type, event.detail || event)`
    )
    .join(',\n');

// TODO(sorvell): Add support for `v-bind`.
const wrapperTemplate = ({
  name,
  tagname,
  events,
  reactiveProperties,
}: LitElementDeclaration) => {
  return javascript`
  const props = {
    ${wrapProps(reactiveProperties)}
    ${wrapEvents(events)}
  };

  const ${name} = defineComponent({
    name: ${name},
    props,
    setup(props, {emit, slots}) {
      const render = () => h(
        "${tagname}",
        {...props,
        ${renderEvents(events)}
        },
        wrapSlots(slots as Slots)
      );
      return () => {
        openBlock();
        return createBlock(render);
      };
    }
  });

  export default ${name};
`;
};
