import {LitElement, html} from 'lit-element';
import {msg} from '@lit/localize';

export class XGreeter extends LitElement {
  render() {
    return html`<p>${msg('greeting', html`Hello <b>World</b>!`)}</p>`;
  }
}
customElements.define('x-greeter', XGreeter);
