// Ensure that the raw text content in the `<style>` tag does not get
// miscompiled into `<?>`.
import { html, render } from 'lit';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<style>
  div::before {
    content: '<!---->';
  }
  div::after {
    content: '<!--?-->';
  }
</style>
<div>Hello world</div>`, parts: [] };
render({ ["_$litType$"]: lit_template_1, values: [] }, document.body);
