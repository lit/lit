/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  AbsolutePath,
  createPackageAnalyzer,
} from '@lit-labs/analyzer/package-analyzer.js';
import {FileTree, writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {LitCli} from '../lit-cli.js';
import * as path from 'path';
import {Command, ResolvedCommand} from '../command.js';
import {Package} from '@lit-labs/analyzer/lib/model.js';
import {EOL} from 'os';
import * as ts from 'typescript';

const reactCommand: Command = {
  name: 'react',
  description: 'Generate React wrapper for a LitElement',
  kind: 'reference',
  installFrom: '@lit-labs/gen-wrapper-react',
  importSpecifier: '@lit-labs/gen-wrapper-react/index.js',
};

const vueCommand: Command = {
  name: 'vue',
  description: 'Generate Vue wrapper for a LitElement',
  kind: 'reference',
  installFrom: '@lit-labs/gen-wrapper-vue',
  importSpecifier: '@lit-labs/gen-wrapper-vue/index.js',
};

const manifestCommand: Command = {
  name: 'manifest',
  description: 'Generate custom-elements.json manifest.',
  kind: 'reference',
  installFrom: '@lit-labs/gen-manifest',
  importSpecifier: '@lit-labs/gen-manifest/index.js',
};

// A generate command has a generate method instead of a run method.
interface GenerateCommand extends Omit<ResolvedCommand, 'run'> {
  generate(options: {package: Package}, console: Console): Promise<FileTree>;
}

const frameworkCommands = {
  react: reactCommand,
  vue: vueCommand,
};

type FrameworkName = keyof typeof frameworkCommands;

export const run = async (
  {
    cli,
    packages,
    frameworks: frameworkNames,
    manifest,
    exclude,
    outDir,
  }: {
    packages: string[];
    frameworks: string[];
    manifest: boolean;
    outDir: string;
    exclude?: string[];
    cli: LitCli;
  },
  console: Console
) => {
  try {
    for (const packageRoot of packages) {
      // Ensure separators in input paths are normalized and resolved to absolute
      const root = path.normalize(path.resolve(packageRoot)) as AbsolutePath;
      const out = path.normalize(path.resolve(outDir)) as AbsolutePath;
      const analyzer = createPackageAnalyzer(root, {exclude});
      const pkg = analyzer.getPackage();
      if (!pkg.packageJson.name) {
        throw new Error(
          `Package at '${packageRoot}' did not have a name in package.json. The 'gen' command requires that packages have a name.`
        );
      }
      const generatorReferences = [];
      for (const name of (frameworkNames ?? []) as FrameworkName[]) {
        const framework = frameworkCommands[name];
        if (framework == null) {
          throw new Error(`No generator exists for framework '${framework}'`);
        }
        generatorReferences.push(framework);
      }
      if (manifest) {
        generatorReferences.push(manifestCommand);
      }
      // Optimistically try to import all generators in parallel.
      // If any aren't installed we need to ask for permission to install it
      // below, but in the common happy case this will do all the loading work.
      await Promise.all(
        generatorReferences.map(async (ref) => {
          const specifier = cli.resolveImportForReference(ref);
          if (specifier != null) {
            await import(specifier);
          }
        })
      );
      // Now go through one by one and install any as necessary.
      // This must be one by one in case we need to ask for permission.
      const generators: GenerateCommand[] = [];
      for (const reference of generatorReferences) {
        const resolved = await cli.resolveCommandAndMaybeInstallNeededDeps(
          reference
        );
        if (resolved == null) {
          throw new Error(`Could not load generator for ${reference.name}`);
        }
        generators.push(resolved as unknown as GenerateCommand);
      }
      const options = {
        package: pkg,
      };
      const results = await Promise.allSettled(
        generators.map(async (generator) => {
          // TODO(kschaaf): Add try/catches around each of these operations and
          // throw more contextual errors
          await writeFileTree(out, await generator.generate(options, console));
        })
      );
      // Log any diagnostics collected while running the generators.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logDiagnostics([...analyzer.getDiagnostics()] as any);
      // `allSettled` will swallow errors, so we need to filter them out of
      // the results and throw a new error up the stack describing all the errors
      // that happened
      const errors = results
        .map((r, i) =>
          r.status === 'rejected'
            ? `Error generating '${generators[i].name}' wrapper for package '${packageRoot}': ` +
                (r.reason as Error).stack ?? r.reason
            : ''
        )
        .filter((e) => e)
        .join('\n');
      if (errors.length > 0) {
        throw new Error(errors);
      }
    }
  } catch (e) {
    console.error((e as Error).message ?? e);
    return 1;
  }
};

const diagnosticsHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName(name: string) {
    return path.resolve(name);
  },
  getCurrentDirectory() {
    return process.cwd();
  },
  getNewLine() {
    return EOL;
  },
};

const logDiagnostics = (diagnostics: Array<ts.Diagnostic>) => {
  if (diagnostics.length > 0) {
    console.log(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticsHost)
    );
  }
};
