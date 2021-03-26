/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Command, flags} from '@oclif/command';
import {readConfigFileAndWriteSchema} from '@lit/localize-tools/lib/config.js';
import {TransformLitLocalizer} from '@lit/localize-tools/lib/modes/transform.js';
import {RuntimeLitLocalizer} from '@lit/localize-tools/lib/modes/runtime.js';
import type {Config} from '@lit/localize-tools/src/types/config';
import {KnownError, unreachable} from '@lit/localize-tools/lib/error.js';
import type {
  TransformOutputConfig,
  RuntimeOutputConfig,
} from '@lit/localize-tools/src/types/modes.js';
import {LitLocalizer} from '@lit/localize-tools/lib/index.js';

export default class LocalizeBuild extends Command {
  static description = 'Build lit-localize projects';

  static examples = [`$ lit localize:build`];

  static flags = {
    config: flags.string({name: 'config', default: './lit-localize.json'}),
  };

  // static args = [];

  async run() {
    const {flags} = this.parse(LocalizeBuild);
    const configPath = flags.config;
    const config = readConfigFileAndWriteSchema(configPath);
    const localizer = makeLocalizer(config);
    console.log('Building');
    const {errors} = localizer.validateTranslations();
    if (errors.length > 0) {
      // TODO(aomarks) It might be more friendly to replace these invalid
      // localized templates with the source ones, show the errors and return
      // non-zero, but still continue with the rest of the process so that at
      // least some of the app can work during development.
      throw new KnownError(
        'One or more localized templates contain a set of placeholders ' +
          '(HTML or template literal expressions) that do not exactly match ' +
          'the source code, aborting. Details:\n\n' +
          errors.join('\n')
      );
    }
    await localizer.build();
  }
}

function makeLocalizer(config: Config): LitLocalizer {
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
          (unreachable(config.output) as Config['output']).mode
        }`
      );
  }
}
