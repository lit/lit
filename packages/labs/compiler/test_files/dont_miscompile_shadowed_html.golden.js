import { html } from 'lit';
import * as litStatic from 'lit-html/static.js';
function trickyTemplate() {
    const html = litStatic.html;
    return html `Do not compile me, I am static!`;
}
const b_1 = i => i;
const lit_template_1 = { h: b_1 `Compile me!`, parts: [] };
({ ["_$litType$"]: lit_template_1, values: [] });
