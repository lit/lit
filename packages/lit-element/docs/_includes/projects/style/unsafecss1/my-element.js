import { LitElement, html, css, unsafeCSS } from 'lit-element';

class MyElement extends LitElement {
  static get styles() {
    const mainWidth = 800;
    const padding = 20;   
    
    return css`
      :host { 
        width: ${unsafeCSS(mainWidth + padding)}px;
      }
    `;
  } 
  render() {
    return html`<div>Some content in a div</div>`;
  }
}

customElements.define('my-element', MyElement);
