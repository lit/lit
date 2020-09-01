import {LitElement, html, customElement, property} from 'lit-element';

@customElement('my-element')
export class MyElement extends LitElement {
  @property()
  greeting = 'Hello';

  @property({attribute: false})
  data = {name: 'Cora'};

  @property({type: Array})
  items = [1, 2, 3];

  render() {
    return html`
      <p>${this.greeting} ${this.data.name}.</p>
      <p>You have ${this.items.length} items.</p>
    `;
  }
}
