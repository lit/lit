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
   *
   * This will be resolved with require.resolve relative to the user's current
   * working directory, and imported if found, or potentially installed if
   * not.
   */
  importSpecifier: string;

  /**
   * The location to `npm install` from, if different from importSpecifier.
   *
   * e.g. this could be a github repo, a relative directory (e.g. for testing, * or it could be an npm package name with a version. Or if the import
   * specifier is 'foo/command.js' then this might be 'foo'.
   *
   * If this is 'foo' then, if this command isn't installed in the user's
   * workspace, we will suggest running `npm install foo`.
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
 *
 * Note that we try to resolve references to commands to power the `lit help`
 * overview, so to keep that fast it's best for your command to
 * dynamically import its actual implementation in its `run()` method.
 */
export interface CommandModule {
  /**
   * Note that this can return a ReferenceToCommand, which the CLI will
   * further resolve.
   *
   * If your module is deferring to another in a different npm package, it's
   * generally preferable to return a ReferenceToCommand rather than doing the
   * dynamic import yourself. That way we use a consistent module resolution
   * strategy, the CLI can offer to install the referenced command if
   * necessary, and we can reuse the error handling code in the CLI core.
   */
  getCommand(opts: GetCommandsOptions): Command | Promise<Command>;
}

/**
 * This type is an important part of the interface between the CLI and lazily
 * loaded command modules. Fields should not be renamed, and required fields
 * should not be removed, otherwise it's a breaking change to the interface.
 */
export interface GetCommandsOptions {
  /**
   * The name (not the alias) of the requested command.
   */
  requestedCommand?: string;
}

/**
 * Like CommandModule, only we're not certain that the module obeys the
 * contract correctly.
 *
 * This is the type we should use internally when loading a module.
 */
export interface MaybeCommandModule {
  getCommand?(
    opts: GetCommandsOptions
  ): undefined | Command | Promise<Partial<Command> | undefined>;
}
