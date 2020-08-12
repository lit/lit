import {LitElement, html} from 'lit-element';
import {Localized} from '../../../lib_client/localized-element.js';
const {getLocale} = {getLocale: () => 'zh_CN'};
console.log(`Locale is ${getLocale()}`);
`\u4F60\u597D\uFF0C\u4E16\u754C\uFF01`;
html`你好, <b><i>世界!</i></b>`;
`Hello World!`;
html`Hello World, click <a href="https://www.example.com/">here</a>!`;
export class MyElement extends LitElement {
  render() {
    return html`<p>
      你好, <b><i>世界!</i></b> (${getLocale()})
    </p>`;
  }
}
