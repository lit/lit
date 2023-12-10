import { html as a } from 'lit';
import { html as b } from 'external-pkg';
import { html } from 'ommit';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<p>Compile me!</p>`, parts: [] };
({ ["_$litType$"]: lit_template_1, values: [] });
const lit_template_2 = { h: b_1 `<p>Compile me!</p>`, parts: [] };
({ ["_$litType$"]: lit_template_2, values: [] });
html `Do not compile me!`;
