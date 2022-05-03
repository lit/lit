/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {OptionDefinition} from 'command-line-usage';
import type {Section} from 'command-line-usage';

export type {OptionDefinition} from 'command-line-usage';
export type {Section} from 'command-line-usage';

export type CommandOptions = {
  [name: string]: unknown;
};

export type Command = ReferenceToCommand | ResolvedCommand;

export function isCommand(
  maybeCommand: Partial<Command> | undefined
): maybeCommand is Command {
  return (
    typeof maybeCommand?.name === 'string' &&
    (maybeCommand.kind === 'reference' || maybeCommand.kind === 'resolved')
  );
}

/**
 * A CLI command definition.
 *
 * This object only contains the metadata about a command and its command line
 * options, not the actual command implementation. The module it's defined in
 * should have as few dependencies as possible in order to minimize the load
 * time of the CLI. The `run()` method should dynamically import a module with
 * the actual implementation.
 */
export interface ResolvedCommand {
  kind: 'resolved';
  /**
   * The main name of the command.
   */
  name: string;

  /**
   * Any aliases, such as shorthands, for the command.
   */
  aliases?: string[];

  description: string;

  options?: OptionDefinition[];

  subcommands?: Command[];

  run(options: CommandOptions, console: Console): Promise<CommandResult | void>;

  /**
   * Documentation to append onto the output of `lit help commandName`.
   */
  getUsageSections?(): Section[];
}

/**
 * A reference to a command whose full definition is in another npm package,
 * which may or may not be installed.
 */
export interface ReferenceToCommand {
  kind: 'reference';
  name: string;
  description: string;
  aliases?: string[];
  /** Note: not guaranteed to be complete! */
  subcommands?: Command[];
  /**
   * The import specifier that resolves to an ES module whose exports match
   * the CommandModule interface.
   */
  importSpecifier: string;
  /**
   * The location to install from, if different than the npm package name.
   *
   * e.g. this could be a github repo, a relative directory (e.g. for testing, * or it could be an npm package name with a version.
   */
  installFrom?: string;
}

/**
 * A command may return a CommandResult to indicate an exit code.
 */
export interface CommandResult {
  exitCode: number;
}

/**
 * This is the type that an ES module that a ReferenceToCommand refers to should
 * obey.
 */
export interface CommandModule {
  /**
   * Note that this can return a ReferenceToCommand, which the CLI will
   * further resolve. This is generally preferable to attempting to do
   * reference resolution yourself.
   */
  getCommand(opts: GetCommandsOptions): Promise<Command>;
}

/**
 * This type is an important part of the interface between the CLI and lazily
 * loaded command modules. Fields should not be renamed, and required fields
 * should not be removed, otherwise it's a breaking change to the interface.
 */
export interface GetCommandsOptions {
  requestedCommand: ReferenceToCommand;
}

/**
 * Like CommandModule, only we're not certain that the module obeys the
 * contract correctly.
 *
 * This is the type we should use internally when loading a module.
 */
export interface MaybeCommandModule {
  getCommand?(opts: GetCommandsOptions): Promise<Partial<Command> | undefined>;
}
