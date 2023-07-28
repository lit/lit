import * as lit from 'lit';

lit.html`<p>Compile me!</p>`;

let renamed = lit;
// TODO: Renaming namespaces not currently handled.
renamed.html`Compile me!`;

renamed = {html: (i) => i};
renamed.html`Do not compile me!`;
