// Ensure that the raw text content in the `<style>` tag does not get
// miscompiled into `<?>`.
import { html, render } from 'lit';

render(html`<style>
  div::before {
    content: '<!---->';
  }
  div::after {
    content: '<!--?-->';
  }
</style>
<div>Hello world</div>`, document.body);
