/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {ruleTester} from './rule-tester.js';
import {noStrings} from '../../rules/no-strings.js';

ruleTester.run('no-strings', noStrings, {
  valid: [
    {
      code: 'const foo = 1;',
    },
  ],
  invalid: [
    {
      code: "const foo = 'baz';",
      output: "const foo = 'baz';",
      errors: [
        {
          messageId: 'no-strings',
        },
      ],
    },
  ],
});
