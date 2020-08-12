import {LitElement, html} from 'lit-element';
import {Localized} from '../../../lib_client/localized-element.js';
const {getLocale} = {getLocale: () => 'es-419'};
console.log(`Locale is ${getLocale()}`);
`Hola Mundo!`;
html`Hola <b><i>Mundo!</i></b>`;
`Hola World!`;
html`Hola World, clic <a href="https://www.example.com/">aquí</a>!`;
export class MyElement extends LitElement {
  render() {
    return html`<p>
      Hola <b><i>Mundo!</i></b> (${getLocale()})
    </p>`;
  }
}
