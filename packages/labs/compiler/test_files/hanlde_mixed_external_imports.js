import {html as a} from 'lit';
import {html as b} from 'external-pkg';
import {html} from 'ommit';

a`<p>Compile me!</p>`
b`<p>Compile me!</p>`
html`Do not compile me!`