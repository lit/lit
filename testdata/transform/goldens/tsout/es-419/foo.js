import {html} from 'lit-html';
const {getLocale} = {getLocale: () => 'es-419'};
console.log(`Locale is ${getLocale()}`);
`Hola Mundo!`;
html`Hola <b><i>Mundo!</i></b>`;
`Hola World!`;
html`Hola World, clic <a href="https://www.example.com/">aquí</a>!`;
