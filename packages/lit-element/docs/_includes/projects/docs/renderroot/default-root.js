import { LitElement, html } from 'lit-element';

/**
 * This element renders its template into the default location:
 * a shadowRoot created by LitElement.
 */
class DefaultRoot extends LitElement {
  render(){
    return html`
      <p><b>Default render root.</b> Template renders in shadow DOM.</p>
    `;
  }
}
customElements.define('default-root', DefaultRoot);
