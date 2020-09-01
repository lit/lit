import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  constructor() {
    super();

    // Request an update in response to an event
    this.addEventListener('load-complete', async (e) => {
      console.log(e.detail.message);
      console.log(await this.requestUpdate());
    });
  }
  render() {
    return html`
      <button @click="${this.fire}">Fire a "load-complete" event</button>
    `;
  }
  fire() {
    let newMessage = new CustomEvent('load-complete', {
      detail: { message: 'hello. a load-complete happened.' }
    });
    this.dispatchEvent(newMessage);
  }
}
customElements.define('my-element', MyElement);
