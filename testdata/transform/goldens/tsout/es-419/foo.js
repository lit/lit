import {LitElement, html} from 'lit-element';
`Hola Mundo!`;
html`Hola <b><i>Mundo!</i></b>`;
`Hola World!`;
html`Hola World, clic <a href="https://www.example.com/">aquí</a>!`;
export class MyElement extends LitElement {
  render() {
    return html`<p>
      Hola <b><i>Mundo!</i></b> (es-419)
    </p>`;
  }
}
