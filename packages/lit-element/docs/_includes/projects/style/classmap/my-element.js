import { LitElement, html, css } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';

class MyElement extends LitElement {
  static get styles() {
    return css`
      .alert {
        font-family: Roboto;
        font-size: 16px;
        padding: 24px; 
        margin: 12px;
        background-color: whitesmoke;
      }
      .warning {
        color: red;
      }
      .info {
        color: blue;
      }
    `;
  }
  
  render() { 
    return html`
      <div class=${classMap({alert:true,info:true})}>Content.</div>
    `;
  }

  // Equivalent: 
  /* 
  render() {
    return html`
      <div class="alert info">Content.</div>
    `;
  }
  */

}
customElements.define('my-element', MyElement);
