import {Command, flags} from '@oclif/command';
import {readConfigFileAndWriteSchema} from '@lit/localize-tools/lib/config.js';
import {TransformLitLocalizer} from '@lit/localize-tools/lib/modes/transform.js';
import {RuntimeLitLocalizer} from '@lit/localize-tools/lib/modes/runtime.js';
import type {Config} from '@lit/localize-tools/src/types/config';
import {printDiagnostics} from '@lit/localize-tools/lib/typescript.js';
import {KnownError, unreachable} from '@lit/localize-tools/lib/error.js';
import type {
  TransformOutputConfig,
  RuntimeOutputConfig,
} from '@lit/localize-tools/src/types/modes.js';
import {LitLocalizer} from '@lit/localize-tools/lib/index.js';

export default class LocalizeExtract extends Command {
  static description = 'Extracts lit-localize messages';

  static examples = [`$ lit localize:extract`];

  static flags = {
    config: flags.string({name: 'config', default: './lit-localize.json'}),
  };

  // static args = [];

  async run() {
    const {flags} = this.parse(LocalizeExtract);
    const configPath = flags.config;
    const config = readConfigFileAndWriteSchema(configPath);
    const localizer = makeLocalizer(config);
    this.log('Extracting messages');
    const {messages, errors} = localizer.extractSourceMessages();
    if (errors.length > 0) {
      printDiagnostics(errors);
      throw new KnownError('Error analyzing program');
    }
    console.log(`Extracted ${messages.length} messages`);
    console.log(`Writing interchange files`);
    await localizer.writeInterchangeFiles();
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
