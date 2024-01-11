/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as fs from 'fs';
import * as jsonSchema from 'jsonschema';
import * as pathLib from 'path';
import {KnownError} from './error.js';
import type {Config, ConfigFile} from './types/config.js';
import {dirname} from 'path';
import {fileURLToPath} from 'url';

export type {Config} from './types/config.js';
export type {
  TransformOutputConfig,
  RuntimeOutputConfig,
} from './types/modes.js';

/**
 * Read a JSON config file from the given path, validate it, and return it. Also
 * adds a "$schema" property if missing. Throws if there was a problem reading,
 * parsing, or validating.
 */
export function readConfigFileAndWriteSchema(configPath: string): Config {
  let str;
  try {
    str = fs.readFileSync(configPath, 'utf8');
  } catch (e) {
    throw new KnownError(
      `Could not read config file from ${configPath}:\n` + (e as Error).message
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(str);
  } catch (e) {
    throw new KnownError(
      `Invalid JSON found in config file ${configPath}:\n` +
        (e as Error).message
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const schemaPath = pathLib.resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'config.schema.json'
  );
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const result = jsonSchema.validate(parsed, schema);
  if (result.errors.length > 0) {
    throw new KnownError(
      `Error validating config file ${configPath}:\n\n` +
        result.errors.map((error) => String(error)).join('\n')
    );
  }

  const validated = parsed as ConfigFile;
  writeConfigSchemaIfMissing(validated, configPath);

  const baseDir = pathLib.dirname(configPath);
  const config = {
    ...validated,
    baseDir,
    resolve: (path: string) => pathLib.resolve(baseDir, path),
  };

  return config;
}

/**
 * Unless already present, add a "$schema" property to the given config object
 * with the lit-localize schema descriptor on GitHub and write it back to disk.
 *
 * This $schema property allows editors like VSCode to provide validation and
 * auto-completion for the config format.
 */
function writeConfigSchemaIfMissing(config: ConfigFile, configPath: string) {
  if ('$schema' in config) {
    return;
  }
  const withSchema = {
    $schema:
      'https://raw.githubusercontent.com/lit/lit/main/packages/localize-tools/config.schema.json',
    ...config,
  };
  const json = JSON.stringify(withSchema, null, 2);
  fs.writeFileSync(configPath, json + '\n', {encoding: 'utf-8'});
}
