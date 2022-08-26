/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {FileTree, writeFileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {generateTsconfig} from './templates/tsconfig.json.js';
import {generatePackage} from './templates/package.json.js';
import {generateIndex} from './templates/index.html.js';
import {generateGitignore} from './templates/gitignore.js';
import {generateNpmignore} from './templates/npmignore.js';
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
    ...generatePackage(name, lang),
    ...generateIndex(name),
    ...generateGitignore(),
    ...generateNpmignore(),
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
  await writeFileTree(path.join(cli.cwd, options.name), files);
  console.log(`Created sharable element in ${options.name}.`);
  return {
    exitCode: 0,
  };
};
