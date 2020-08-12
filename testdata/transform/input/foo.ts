import {LitElement, html} from 'lit-element';
import {
  msg,
  configureTransformLocalization,
} from '../../../lib_client/index.js';
import {Localized} from '../../../lib_client/localized-element.js';

const {getLocale} = configureTransformLocalization({sourceLocale: 'en'});
console.log(`Locale is ${getLocale()}`);

msg('string', 'Hello World!');

msg('lit', html`Hello <b><i>World!</i></b>`);

msg('variables_1', (name: string) => `Hello ${name}!`, 'World');

msg(
  'lit_variables_1',
  (url: string, name: string) =>
    html`Hello ${name}, click <a href="${url}">here</a>!`,
  'https://www.example.com/',
  'World'
);

export class MyElement extends Localized(LitElement) {
  render() {
    return html`<p>
      ${msg('lit', html`Hello <b><i>World!</i></b>`)} (${getLocale()})
    </p>`;
  }
}
