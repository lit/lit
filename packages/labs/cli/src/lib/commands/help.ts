/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import chalk from 'chalk';
import commandLineUsage from 'command-line-usage';

import {globalOptions} from '../options.js';
import {CommandOptions, ResolvedCommand} from '../command.js';
import {LitCli} from '../lit-cli.js';

const HELP_HEADER = `${chalk.bold.underline('Lit CLI')}
Usage: lit <command> [options ...]`;

export const makeHelpCommand = (cli: LitCli): ResolvedCommand => {
  const generateGeneralUsage = async () => {
    return commandLineUsage([
      {
        content: HELP_HEADER,
        raw: true,
      },
      {
        header: 'Available Commands',
        content: await Promise.all(
          [...cli.commands.values()].map(async (command) => {
            command = await cli.resolveCommandAsMuchAsPossible(command);
            return {name: command.name, summary: command.description};
          })
        ),
      },
      {header: 'Global Options', optionList: globalOptions},
      {
        content: 'Run `lit help <command>` for help with a specific command.',
        raw: true,
      },
    ]);
  };

  const generateCommandUsage = (
    command: ResolvedCommand,
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
    kind: 'resolved',
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
      let commandNames = options['command'] as Array<string> | string | null;

      if (typeof commandNames === 'string') {
        commandNames = commandNames?.split(' ') ?? [];
      }

      commandNames = commandNames?.map((c) => c.trim()) ?? null;

      if (commandNames == null) {
        console.debug('no command given, printing general help...', {options});
        console.log(await generateGeneralUsage());
        return;
      }

      const result = await cli.getCommand(cli.commands, commandNames);
      if ('invalidCommand' in result) {
        console.error(
          `'${commandNames.join(' ')}' is not an available command.`
        );
        console.log(await generateGeneralUsage());
        return;
      } else if ('commandNotInstalled' in result) {
        console.error(`'${commandNames.join(' ')}' wasn't installed.`);
        return;
      }
      console.debug(`printing help for command '${commandNames}'...`);
      console.log(generateCommandUsage(result.command, commandNames));
    },
  };
};
