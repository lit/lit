import { styleMap } from 'lit-html/directives/style-map';
import { LitElement, html } from 'lit-element';

export const div3styles = {
  'background-color': 'blue',
  fontFamily: 'Roboto',
  '--custom-color': '#e26dd2',
  '--otherCustomColor': '#77e26d'
};

export class Div3 extends LitElement {
  render() {
    return html`
    <div style=${styleMap(div3styles)}>
      <h3>Div 3</h3>
      <p>Styled with styleMap</p>
      <p style=${styleMap({
        color: 'var(--custom-color)'
      })}>A paragraph using <code>--custom-color</code></p>
      <p style=${styleMap({
        color: 'var(--otherCustomColor)'
      })}>A paragraph using <code>--otherCustomColor</code></p>
    </div>`;
  }
}

customElements.define('div-3', Div3);
