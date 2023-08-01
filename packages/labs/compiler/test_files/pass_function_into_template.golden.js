import { html } from 'lit-html';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<p>Inner</p>`, parts: [] };
const inner = () => ({ ["_$litType$"]: lit_template_1, values: [] });
const lit_template_2 = { h: b_1 `<div><?></div>`, parts: [{ type: 2, index: 1 }] };
const outer = () => ({ ["_$litType$"]: lit_template_2, values: [inner()] });
