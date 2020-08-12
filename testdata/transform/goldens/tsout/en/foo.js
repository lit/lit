import {LitElement, html} from 'lit-element';
import {Localized} from '../../../lib_client/localized-element.js';
const {getLocale} = {getLocale: () => 'en'};
console.log(`Locale is ${getLocale()}`);
('Hello World!');
html`Hello <b><i>World!</i></b>`;
`Hello World!`;
html`Hello World, click <a href="https://www.example.com/">here</a>!`;
export class MyElement extends LitElement {
  render() {
    return html`<p>
      Hello <b><i>World!</i></b> (${getLocale()})
    </p>`;
  }
}
