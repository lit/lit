/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {e2eGoldensTest} from './e2e-goldens-test.js';

e2eGoldensTest(
  'placeholder-errors',
  ['--config=lit-localize.json', 'build'],
  1,
  `One or more localized templates contain a set of placeholders (HTML or template literal expressions) that do not exactly match the source code, aborting. Details:

Placeholder error in es-419 localization of extra-expression: unexpected "\${alert("evil")}"
Placeholder error in es-419 localization of missing-expression: missing "\${name}"
Placeholder error in es-419 localization of missing-html: missing "<b>"
Placeholder error in es-419 localization of missing-html: missing "</b>"
Placeholder error in es-419 localization of changed-html: unexpected "<blink>"
Placeholder error in es-419 localization of changed-html: unexpected "</blink>"
Placeholder error in es-419 localization of changed-html: missing "<b>"
Placeholder error in es-419 localization of changed-html: missing "</b>"`
);
