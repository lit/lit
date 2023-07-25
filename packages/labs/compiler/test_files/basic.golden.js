import { html } from 'lit-html';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<h1>Hello <?><?></h1>`, parts: [{ type: 2, index: 1 }, { type: 2, index: 2 }] };
export const sayHello = (name) => ({ ["_$litType$"]: lit_template_1, values: [name, '!'] });
