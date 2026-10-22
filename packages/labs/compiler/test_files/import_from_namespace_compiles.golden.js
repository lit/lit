import * as lit from 'lit';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<p>Compile me!</p>`, parts: [] };
({ ["_$litType$"]: lit_template_1, values: [] });
let renamed = lit;
// TODO: Renaming namespaces not currently handled.
renamed.html `Compile me!`;
renamed = { html: (i) => i };
renamed.html `Do not compile me!`;
