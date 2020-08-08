import {LitElement, html} from 'lit-element';
('Hello World!');
html`Hello <b><i>World!</i></b>`;
`Hello World!`;
html`Hello World, click <a href="https://www.example.com/">here</a>!`;
export class MyElement extends LitElement {
  render() {
    return html`<p>
      Hello <b><i>World!</i></b> (en)
    </p>`;
  }
}
