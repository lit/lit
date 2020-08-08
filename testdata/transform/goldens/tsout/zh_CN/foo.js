import {LitElement, html} from 'lit-element';
`\u4F60\u597D\uFF0C\u4E16\u754C\uFF01`;
html`你好, <b><i>世界!</i></b>`;
`Hello World!`;
html`Hello World, click <a href="https://www.example.com/">here</a>!`;
export class MyElement extends LitElement {
  render() {
    return html`<p>
      你好, <b><i>世界!</i></b> (zh_CN)
    </p>`;
  }
}
