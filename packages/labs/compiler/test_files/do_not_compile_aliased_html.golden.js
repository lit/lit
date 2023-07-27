// TODO(ajakubowicz): Should we add support for aliased imports from 'lit' and
// 'lit-html'?
import { html as h } from 'lit-html';
import { render } from 'lit';
render(h `<p>Hello</p>`, document.body);
