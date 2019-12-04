import { LitElement, html, customElement, property } from 'lit-element';

@customElement('my-element')
class MyElement extends LitElement {

  @property({type: String})
  name = 'World';

  constructor() {
    super();
  }

  render(){
    return html`
      <p>Hello, ${this.name}!</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
