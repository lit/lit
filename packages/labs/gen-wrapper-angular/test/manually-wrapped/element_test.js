/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { suite } from 'uvu';
// eslint-disable-next-line import/extensions
import * as assert from 'uvu/assert';
const test = suite('Manually-wrapped component test');
test('boo', () => {
    assert.ok(true);
});
test.run();
//# sourceMappingURL=element_test.js.map