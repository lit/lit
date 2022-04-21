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

/**
 * A CLI command definition.
 *
 * This object only contains the metadata about a command and its command line
 * options, not the actual command implementation. The module it's defined in
 * should have as few dependencies as possible in order to minimize the load
 * time of the CLI. The `run()` method should dynamically import a module with
 * the actual implementation.
 */
export interface Command {
  /**
   * The main name of the command.
   */
  name: string;

  /**
   * Any aliases, such as shortnads, for the command.
   */
  aliases?: string[];

  description: string;

  options?: OptionDefinition[];

  subcommands?: Command[];

  run(options: CommandOptions, console: Console): Promise<CommandResult | void>;

  /**
   * Documentation to append onto the output of `lit help commandName`.
   */
  getUsageSections?(): Promise<Section[]>;
}

/**
 * A command may return a CommandResult to indicate an exit code.
 */
export interface CommandResult {
  exitCode: number;
}
