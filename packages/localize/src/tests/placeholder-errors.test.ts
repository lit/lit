/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {e2eGoldensTest} from './e2e-goldens-test';

e2eGoldensTest(
  'placeholder-errors',
  ['--config=lit-localize.json'],
  1,
  `One or more localized templates contain a set of placeholders (HTML or template literal expressions) that do not exactly match the source code, aborting. Details:

Placeholder error in es-419 localization of extra-expression: unexpected "\${alert("evil")}"
Placeholder error in es-419 localization of missing-expression: missing "\${name}"
Placeholder error in es-419 localization of changed-expression: unexpected "\${alert("evil") || name}"
Placeholder error in es-419 localization of changed-expression: missing "\${name}"
Placeholder error in es-419 localization of missing-html: missing "<b>"
Placeholder error in es-419 localization of missing-html: missing "</b>"
Placeholder error in es-419 localization of changed-html: unexpected "<blink>"
Placeholder error in es-419 localization of changed-html: unexpected "</blink>"
Placeholder error in es-419 localization of changed-html: missing "<b>"
Placeholder error in es-419 localization of changed-html: missing "</b>"`
);
