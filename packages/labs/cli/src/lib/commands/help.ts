/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import chalk from 'chalk';
import commandLineUsage from 'command-line-usage';

import {globalOptions} from '../options.js';
import {Command, CommandOptions} from '../command.js';

const CLI_TITLE = chalk.bold.underline('Lit CLI');
// const CLI_DESCRIPTION = '...';
const CLI_USAGE = 'Usage: `lit <command> [options ...]`';

const HELP_HEADER = `${CLI_TITLE}

${CLI_USAGE}`;

export const makeHelpCommand = (commands: Map<String, Command>): Command => {
  const generateGeneralUsage = () => {
    return commandLineUsage([
      {
        content: HELP_HEADER,
        raw: true,
      },
      {
        header: 'Available Commands',
        content: [...commands.values()].map((command) => {
          return {name: command.name, summary: command.description};
        }),
      },
      {header: 'Global Options', optionList: globalOptions},
      {
        content: 'Run `lit help <command>` for help with a specific command.',
        raw: true,
      },
    ]);
  };

  const generateCommandUsage = async (command: Command) => {
    const extraUsageGroups = (await command.getUsageSections?.()) ?? [];
    const usageGroups: commandLineUsage.Section[] = [
      {
        header: `lit ${command.name}`,
        content: command.description,
      },
      {header: 'Command Options', optionList: command.options},
      {header: 'Global Options', optionList: globalOptions},
    ];

    if (command.aliases !== undefined && command.aliases.length > 0) {
      usageGroups.splice(1, 0, {header: 'Alias(es)', content: command.aliases});
    }

    return commandLineUsage(usageGroups.concat(extraUsageGroups));
  };

  return {
    name: 'help',
    description: 'Shows this help message, or help for a specific command',
    options: [
      {
        name: 'command',
        description: 'The command to display help for',
        defaultOption: true,
      },
    ],

    async run(options: CommandOptions, console: Console) {
      const commandName = options['command'] as string | null;
      if (commandName === null) {
        console.debug('no command given, printing general help...', {options});
        console.log(generateGeneralUsage());
        return;
      }

      const command = commands.get(commandName);
      if (command === undefined) {
        console.error(`'${commandName}' is not an available command.`);
        console.log(generateGeneralUsage());
        return;
      }

      console.debug(`printing help for command '${commandName}'...`);
      console.log(await generateCommandUsage(command));
    },
  };
};
