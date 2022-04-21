/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import chalk from 'chalk';
import commandLineUsage from 'command-line-usage';

import {globalOptions} from '../options.js';
import {Command, CommandOptions} from '../command.js';
import {LitCli} from '../lit-cli.js';

const CLI_TITLE = chalk.bold.underline('Lit CLI');
// const CLI_DESCRIPTION = '...';
const CLI_USAGE = 'Usage: `lit <command> [options ...]`';

const HELP_HEADER = `${CLI_TITLE}

${CLI_USAGE}`;

export const makeHelpCommand = (cli: LitCli): Command => {
  const generateGeneralUsage = () => {
    return commandLineUsage([
      {
        content: HELP_HEADER,
        raw: true,
      },
      {
        header: 'Available Commands',
        content: [...cli.commands.values()].map((command) => {
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

  const generateCommandUsage = (
    command: Command,
    commandNames: Array<string>
  ) => {
    const usageGroups: commandLineUsage.Section[] = [
      {
        header: `lit ${commandNames.join(' ')}`,
        content: command.description,
      },
    ];
    if (command.aliases !== undefined && command.aliases.length > 0) {
      usageGroups.push({header: 'Alias(es)', content: command.aliases});
    }
    if (command.getUsageSections !== undefined) {
      usageGroups.push(...command.getUsageSections());
    }
    if (command.subcommands !== undefined) {
      usageGroups.push({
        header: 'Sub-Commands',
        content: command.subcommands.map((s) => ({
          name: s.name,
          summary: s.description,
        })),
      });
    }
    if (command.options !== undefined) {
      usageGroups.push({
        header: 'Command Options',
        optionList: command.options,
      });
    }
    usageGroups.push({header: 'Global Options', optionList: globalOptions});
    return commandLineUsage(usageGroups);
  };

  return {
    name: 'help',
    description: 'Shows this help message, or help for a specific command',
    options: [
      {
        name: 'command',
        description: 'The command to display help for',
        type: String,
        multiple: true,
        defaultOption: true,
      },
    ],

    async run(options: CommandOptions, console: Console) {
      const commandNames = options['command'] as Array<string> | null;

      if (commandNames == null) {
        console.debug('no command given, printing general help...', {options});
        console.log(generateGeneralUsage());
        return;
      }

      const result = cli.getCommand(cli.commands, commandNames);
      if ('invalidCommand' in result) {
        console.error(
          `'${commandNames.join(' ')}' is not an available command.`
        );
        console.log(generateGeneralUsage());
        return;
      }
      console.debug(`printing help for command '${commandNames}'...`);
      console.log(generateCommandUsage(result.command, commandNames));
    },
  };
};
