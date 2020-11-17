import {LitElement, html} from 'lit-element';
import {msg} from '@lit/localize';

export class XGreeter extends LitElement {
  render() {
    return html`<p>${msg(html`Hello <b>World</b>!`, {id: 'greeting'})}</p>`;
  }
}
customElements.define('x-greeter', XGreeter);
