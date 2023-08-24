// Ensure that the raw text content in the `<style>` tag does not get
// miscompiled into `<?>`.
import { html, render } from 'lit';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<style>\n  div::before {\n    content: '<!---->';\n  }\n  div::after {\n    content: '<!--?-->';\n  }\n</style>\n<div>Hello world</div>`, parts: [] };
render({ ["_$litType$"]: lit_template_1, values: [] }, document.body);
