import { render } from 'lit-html';

/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<h1>Hello <?><?></h1>`, parts: [{ type: 2, index: 1 }, { type: 2, index: 2 }] };
const sayHello = (name) => ({ ["_$litType$"]: lit_template_1, values: [name, '!'] });
render(sayHello('potato'), document.body);

export { sayHello };
//# sourceMappingURL=basic.js.map
