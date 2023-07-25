import { html } from 'lit-html';
const lit_template_1 = { h: (i => i) `<p>Inner</p>`, parts: [] };
const inner = () => ({ _$litType$: lit_template_1, values: [] });
const lit_template_2 = { h: (i => i) `<div><?></div>`, parts: [{ type: 2, index: 1 }] };
const outer = () => ({ _$litType$: lit_template_2, values: [inner()] });
