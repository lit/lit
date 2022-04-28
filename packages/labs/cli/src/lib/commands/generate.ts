/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {AbsolutePath} from '@lit-labs/analyzer/lib/paths.js';
import {Command} from '../command.js';

export const generate: Command = {
  name: 'gen',
  description: 'Generate Framework Wrappers',
  subcommands: [
    {
      name: 'react',
      description: 'Generate React framework wrapper',
      options: [{name: 'packageRoot', defaultValue: './'}],
      async run({packageRoot}: {packageRoot: string}, console: Console) {
        const generateReactWrappers = await import('../generate/react.js');
        await generateReactWrappers.run(packageRoot as AbsolutePath, console);
      },
    },
  ],
  async run() {
    throw new Error('must use extract or build');
  },
};
