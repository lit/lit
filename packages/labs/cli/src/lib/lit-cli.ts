/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import commandLineCommands from 'command-line-commands';
import commandLineArgs from 'command-line-args';

import {
  Command,
  isCommand,
  MaybeCommandModule,
  ReferenceToCommand,
  ResolvedCommand,
} from './command.js';
import {LitConsole} from './console.js';
import {globalOptions, mergeOptions} from './options.js';
import {makeHelpCommand} from './commands/help.js';
import {localize} from './commands/localize.js';
import {makeLabsCommand} from './commands/labs.js';
import {makeInitCommand} from './commands/init.js';
import {createRequire} from 'module';
import * as childProcess from 'child_process';

export interface Options {
  // Mandatory, so that all tests must specify it.
  cwd: string;
  console?: LitConsole;
  stdin?: NodeJS.ReadableStream;
}

export class LitCli {
  readonly commands = new Map<string, Command>();
  readonly args: readonly string[];
  readonly console: LitConsole;
  /** The current working directory. */
  readonly cwd: string;
  private readonly stdin: NodeJS.ReadableStream;

  constructor(args: string[], options: Options) {
    this.cwd = options.cwd;
    this.stdin = options.stdin ?? process.stdin;
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
    this.addCommand(makeLabsCommand(this));
    this.addCommand(makeHelpCommand(this));
    this.addCommand(makeInitCommand(this));
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
    const helpCommand = this.commands.get('help');
    if (helpCommand?.kind !== 'resolved') {
      throw new Error(`Internal error: help command not found`);
    }
    this.console.debug('running...');

    // If the "--version" flag is ever present, just print
    // the current version. Useful for globally installed CLIs.
    if (this.args.includes('--version')) {
      const require = createRequire(import.meta.url);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      console.log(require('../package.json').version);
      return;
    }

    const result = await this.getCommand(this.commands, this.args);
    if ('invalidCommand' in result) {
      return await helpCommand.run(
        {command: [result.invalidCommand]},
        this.console
      );
    } else if ('commandNotInstalled' in result) {
      this.console.error(`Command not installed.`);
      return {exitCode: 1};
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
        return await helpCommand.run({command: commandName}, this.console);
      }

      this.console.debug('Running command...');
      return await command.run(commandOptions, this.console);
    }
  }

  async getCommand(
    commands: Map<string, Command>,
    args: ReadonlyArray<string>,
    parentCommandNames: Array<string> = []
  ): Promise<
    | {commandName: string; command: ResolvedCommand; argv: string[]}
    | {invalidCommand: string}
    | {commandNotInstalled: boolean}
  > {
    try {
      const parsedArgs = commandLineCommands([...commands.keys()], [...args]);
      const commandName = parsedArgs.command;
      let command = commandName && commands.get(commandName);
      if (!commandName || command == null || command == '') {
        return {invalidCommand: commandName ?? 'unknown command'};
      }
      const maybeCommand = await this.resolveCommandAndMaybeInstallNeededDeps(
        command
      );
      if (maybeCommand === undefined) {
        return {commandNotInstalled: true};
      }
      command = maybeCommand;

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
    } catch (error: unknown) {
      // We need a valid command name to do anything. If the given
      // command is invalid, run the generalized help command.
      if (error instanceof Error && error.name === 'INVALID_COMMAND') {
        return {
          invalidCommand: [
            ...parentCommandNames,
            (error as unknown as {command: string}).command,
          ].join(' '),
        };
      }
      // If an unexpected error occurred, propagate it
      throw error;
    }
  }

  resolveImportForReference(reference: ReferenceToCommand): string | undefined {
    try {
      // Must prepend with `file://` so that windows absolute paths are valid
      // ESM import specifiers
      return (
        'file://' +
        createRequire(this.cwd).resolve(reference.importSpecifier, {
          paths: [this.cwd],
        })
      );
    } catch (e: unknown) {
      if ((e as undefined | {code?: string})?.code === 'MODULE_NOT_FOUND') {
        return undefined;
      }
      throw e;
    }
  }

  private async loadCommandFromPath(
    reference: ReferenceToCommand,
    path: string
  ): Promise<Command> {
    const mod = (await import(path)) as MaybeCommandModule;
    if (mod.getCommand == null) {
      throw new Error(
        `Expected file at ${path} to export a function named 'getCommand'`
      );
    }
    const maybeCommand = await mod.getCommand({
      requestedCommand: reference.name,
    });
    if (!isCommand(maybeCommand)) {
      throw new Error(
        `Expected getCommand function at ${path} to return an object that looks like a Command.`
      );
    }
    return maybeCommand;
  }

  async resolveCommandAsMuchAsPossible(reference: Command): Promise<Command> {
    if (reference.kind === 'resolved') {
      return reference;
    }
    const resolvedPackageLocation = this.resolveImportForReference(reference);
    if (resolvedPackageLocation === undefined) {
      return reference;
    }
    const command = await this.loadCommandFromPath(
      reference,
      resolvedPackageLocation
    );
    if (command.kind === 'reference') {
      return this.resolveCommandAsMuchAsPossible(command);
    }
    return command;
  }

  async resolveCommandAndMaybeInstallNeededDeps(
    maybeReference: Command
  ): Promise<ResolvedCommand | undefined> {
    if (maybeReference.kind === 'resolved') {
      return maybeReference;
    }
    const reference = maybeReference;
    let resolvedPackageLocation = this.resolveImportForReference(reference);
    if (resolvedPackageLocation === undefined) {
      const installed = await this.installDepWithPermission(reference);
      if (!installed) {
        return undefined;
      }
      resolvedPackageLocation = this.resolveImportForReference(reference);
      if (resolvedPackageLocation === undefined) {
        throw new Error(
          `Internal error: could not resolve command after what looked like a successful installation.`
        );
      }
    }
    const command = await this.loadCommandFromPath(
      reference,
      resolvedPackageLocation
    );
    if (command.kind === 'reference') {
      return this.resolveCommandAndMaybeInstallNeededDeps(command);
    }
    return command;
  }

  private async installDepWithPermission(
    reference: ReferenceToCommand
  ): Promise<boolean> {
    const havePermission = await this.getPermissionToInstall(reference);
    if (!havePermission) {
      return false;
    }
    const installFrom = reference.installFrom ?? reference.importSpecifier;
    this.console.log(`Installing ${installFrom}...`);
    const child = childProcess.spawn(
      // https://stackoverflow.com/questions/43230346/error-spawn-npm-enoent
      /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
      ['install', '--save-dev', installFrom],
      {
        cwd: this.cwd,
        stdio: [process.stdin, 'pipe', 'pipe'],
      }
    );
    (async () => {
      for await (const line of child.stdout) {
        this.console.log(line.toString());
      }
    })();
    (async () => {
      for await (const line of child.stderr) {
        this.console.error(line.toString());
      }
    })();
    const succeeded = await new Promise<boolean>((resolve) => {
      child.on('exit', (code) => {
        resolve(code === 0);
      });
      child.on('error', (err) => {
        this.console.error(`Error installing dependency: ${err}`);
        resolve(false);
      });
    });
    return succeeded;
  }

  private async getPermissionToInstall(
    reference: ReferenceToCommand
  ): Promise<boolean> {
    this.console.log(`The command ${reference.name} is not installed.
Run 'npm install --save-dev ${
      reference.installFrom ?? reference.importSpecifier
    }'? [Y/n]`);
    // read a line from this.stdin
    const line = await new Promise<string>((resolve) => {
      const closeHandler = (data: unknown) => {
        if (data) {
          resolve(String(data));
        } else {
          resolve('');
        }
      };
      this.stdin.once('close', closeHandler);
      this.stdin.once('data', (data: unknown) => {
        resolve(String(data));
        this.stdin.removeListener('close', closeHandler);
      });
    });
    return line === '\n' || line.trim().toLowerCase() === 'y';
  }
}
