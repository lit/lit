import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  // TODO: Create a `properties` getter; declare a property
  // TODO: Add a constructor; initialize the property
  render() {
    return html`
      <!-- TODO: Replace text content with your property -->
      <p>Hello world! From my-element</p>
    `;
  }
}
customElements.define('my-element', MyElement);
