import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() {
    return { 
      message: { type: String } 
      // TODO: Add a boolean property
      // TODO: Add an array property
    };
  }
  constructor() {
    super();
    this.message = 'Hello world! From my-element';
    // TODO: Initialize boolean property
    // TODO: Initialize array property
  }
  render() {
    return html`
      <p>${this.message}</p>
      <!-- TODO: Add a loop -->
      <!-- TODO: Add a conditional -->
    `;
  }
}
customElements.define('my-element', MyElement);
  