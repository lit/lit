import { html as a } from 'lit';
// TODO: Renaming import outside the import declaration is not supported.
// This test doesn't currently work correctly.
const b = a;
const c = b;
let g = 1, d = c, f = 1;
d `Compile me!`;
d = (i) => i;
d `Do not compile me!`;
