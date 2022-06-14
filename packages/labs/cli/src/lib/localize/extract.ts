/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  readConfigFileAndWriteSchema,
  Config,
  TransformOutputConfig,
  RuntimeOutputConfig,
} from '@lit/localize-tools/lib/config.js';
import {TransformLitLocalizer} from '@lit/localize-tools/lib/modes/transform.js';
import {RuntimeLitLocalizer} from '@lit/localize-tools/lib/modes/runtime.js';
import {printDiagnostics} from '@lit/localize-tools/lib/typescript.js';
import {KnownError, unreachable} from '@lit/localize-tools/lib/error.js';
import {LitLocalizer} from '@lit/localize-tools/lib/index.js';

export const run = async (configPath: string, console: Console) => {
  const config = readConfigFileAndWriteSchema(configPath);
  const localizer = makeLocalizer(config);
  // TODO(aomarks) Don't even require the user to have configured their output
  // mode if they're just doing extraction.
  console.log('Extracting messages');
  const {messages, errors} = localizer.extractSourceMessages();
  if (errors.length > 0) {
    printDiagnostics(errors);
    throw new KnownError('Error analyzing program');
  }
  console.log(`Extracted ${messages.length} messages`);
  console.log(`Writing interchange files`);
  await localizer.writeInterchangeFiles();
};

const makeLocalizer = (config: Config): LitLocalizer => {
  switch (config.output.mode) {
    case 'transform':
      return new TransformLitLocalizer(
        // TODO(aomarks) Unfortunate that TypeScript doesn't automatically do
        // this type narrowing. Because the union is on a nested property?
        config as Config & {output: TransformOutputConfig}
      );
    case 'runtime':
      return new RuntimeLitLocalizer(
        config as Config & {output: RuntimeOutputConfig}
      );
    default:
      throw new KnownError(
        `Internal error: unknown mode ${
          (unreachable(config.output as never) as Config['output']).mode
        }`
      );
  }
};
