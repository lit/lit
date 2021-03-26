/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {Command} from '@oclif/command';

export default class Localize extends Command {
  static description = 'Runs lit-localize';

  static examples = [`$ lit localize:extract`, `$ lit localize:build`];

  async run() {
    this.log(`Use the commands localize:extract or localize:build`);
  }
}
