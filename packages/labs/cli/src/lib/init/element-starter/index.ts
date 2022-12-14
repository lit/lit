/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FileTree, writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {generateTsconfig} from './templates/tsconfig.json.js';
import {generatePackageJson} from './templates/package.json.js';
import {generateIndex} from './templates/demo/index.html.js';
import {generateGitignore} from './templates/gitignore.js';
import {generateElement} from './templates/lib/element.js';
import {CommandResult} from '../../command.js';
import {InitCommandOptions} from '../../commands/init.js';
import {LitCli} from '../../lit-cli.js';
import path from 'path';

export const generateLitElementStarter = async (
  options: InitCommandOptions
): Promise<FileTree> => {
  const {name, lang} = options;
  let files = {
    ...generatePackageJson(name, lang),
    ...generateIndex(name),
    ...generateGitignore(lang),
    ...generateElement(name, lang),
  };
  if (lang === 'ts') {
    files = {
      ...files,
      ...generateTsconfig(),
    };
  }
  return files;
};

export const run = async (
  options: InitCommandOptions,
  console: Console,
  cli: LitCli
): Promise<CommandResult> => {
  const files = await generateLitElementStarter(options);
  const outPath = path.join(cli.cwd, options.out, options.name);
  await writeFileTree(outPath, files);
  const relativePath = path.relative(cli.cwd, outPath);
  console.log(`Created sharable element in ${relativePath}/.`);
  return {
    exitCode: 0,
  };
};
