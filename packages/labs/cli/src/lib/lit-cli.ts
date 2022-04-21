/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import commandLineCommands from 'command-line-commands';
import commandLineArgs from 'command-line-args';

import {Command} from './command.js';
import {LitConsole} from './console.js';
import {globalOptions, mergeOptions} from './options.js';
import {makeHelpCommand} from './commands/help.js';
import {localize} from './commands/localize.js';
import {createRequire} from 'module';

export interface Options {
  console?: LitConsole;
}

export class LitCli {
  commands: Map<string, Command> = new Map();
  args: string[];
  console: LitConsole;

  constructor(args: string[], options?: Options) {
    this.console =
      options?.console ?? new LitConsole(process.stdout, process.stderr);
    this.console.logLevel = 'info';

    // If the "--quiet"/"-q" flag is ever present, set our global logging
    // to quiet mode. Also set the level on the logger we've already created.
    if (args.indexOf('--quiet') > -1 || args.indexOf('-q') > -1) {
      this.console.logLevel = 'error';
    }

    // If the "--verbose"/"-v" flag is ever present, set our global logging
    // to verbose mode. Also set the level on the logger we've already created.
    if (args.indexOf('--verbose') > -1 || args.indexOf('-v') > -1) {
      this.console.logLevel = 'debug';
    }

    this.args = args;

    this.console.debug('got args:', {args: args});

    this.addCommand(localize);
    // This must be the last command added
    this.addCommand(makeHelpCommand(this));
  }

  addCommand(command: Command) {
    this.console.debug('adding command', command.name);
    this.commands.set(command.name, command);

    command.aliases?.forEach((alias) => {
      this.console.debug('adding alias', alias);
      this.commands.set(alias, command);
    });
  }

  async run() {
    const helpCommand = this.commands.get('help')!;
    this.console.debug('running...');

    // If the "--version" flag is ever present, just print
    // the current version. Useful for globally installed CLIs.
    if (this.args.indexOf('--version') > -1) {
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      console.log(require('../package.json').version);
      return;
    }

    const result = this.getCommand(this.commands, this.args);
    if ('invalidCommand' in result) {
      return helpCommand.run({command: result.invalidCommand}, this.console);
    } else {
      const commandName = result.commandName;
      const command = result.command;
      const commandArgs = result.argv;

      this.console.debug(
        `command '${commandName}' found, parsing command args:`,
        {args: commandArgs}
      );

      const commandDefinitions = mergeOptions([
        command.options ?? [],
        globalOptions,
      ]);

      const commandOptions = commandLineArgs(commandDefinitions, {
        argv: commandArgs,
      });
      this.console.debug(`command options parsed from args:`, commandOptions);

      // Help is a special argument for displaying help for the given command.
      // If found, run the help command instead, with the given command name as
      // an option.
      if (commandOptions['help']) {
        this.console.debug(
          `'--help' option found, running 'help' for given command...`
        );
        return helpCommand.run({command: commandName}, this.console);
      }

      this.console.debug('Running command...');
      return command.run(commandOptions, this.console);
    }
  }

  getCommand(
    commands: Map<string, Command>,
    args: ReadonlyArray<string>,
    parentCommandNames: Array<string> = []
  ):
    | {commandName: string; command: Command; argv: string[]}
    | {invalidCommand: string} {
    try {
      const parsedArgs = commandLineCommands([...commands.keys()], [...args]);
      const commandName = parsedArgs.command!;
      const command = commands.get(commandName)!;
      if (command.subcommands !== undefined && parsedArgs.argv.length > 0) {
        const subcommands = new Map<string, Command>(
          command.subcommands.map((c) => [c.name, c])
        );
        return this.getCommand(subcommands, parsedArgs.argv, [
          ...parentCommandNames,
          commandName,
        ]);
      }
      return {
        commandName: [...parentCommandNames, commandName].join(' '),
        command,
        argv: parsedArgs.argv,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // We need a valid command name to do anything. If the given
      // command is invalid, run the generalized help command.
      if (error.name === 'INVALID_COMMAND') {
        return {
          invalidCommand: [...parentCommandNames, error.command].join(' '),
        };
      }
      // If an unexpected error occurred, propagate it
      throw error;
    }
  }
}
