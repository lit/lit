import { html } from 'lit-html';
const lit_template_1 = { h: (i => i) `<h1>Hello <?><?></h1>`, parts: [{ type: 2, index: 1 }, { type: 2, index: 2 }] };
export const sayHello = (name) => ({ _$litType$: lit_template_1, values: [name, '!'] });
