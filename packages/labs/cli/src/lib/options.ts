/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import type {OptionDefinition} from 'command-line-usage';
export type {OptionDefinition} from 'command-line-usage';

export const globalOptions: OptionDefinition[] = [
  {
    name: 'verbose',
    description: 'turn on debugging output',
    type: Boolean,
    alias: 'v',
    group: 'global',
  },
  {
    name: 'help',
    description: 'print out helpful usage information',
    type: Boolean,
    alias: 'h',
    group: 'global',
  },
  {
    name: 'quiet',
    description: 'silence output',
    type: Boolean,
    alias: 'q',
    group: 'global',
  },
  {
    name: 'version',
    description: 'Print version info.',
    type: Boolean,
    group: 'global',
  },
];

/**
 * Performs a simple merge of multiple arguments lists. Does not mutate given
 * arguments lists or arguments.
 *
 * This doesn't perform any validation of duplicate arguments, multiple
 * defaults, etc., because by the time this function is run, the user can't do
 * anything about it. Validation of command and global arguments should be done
 * in tests, not on users machines.
 */
export function mergeOptions(
  optionsLists: OptionDefinition[][]
): OptionDefinition[] {
  const optionsByName = new Map<string, OptionDefinition>();
  for (const opts of optionsLists) {
    for (const option of opts) {
      optionsByName.set(
        option.name,
        Object.assign({}, optionsByName.get(option.name), option)
      );
    }
  }
  return Array.from(optionsByName.values());
}
