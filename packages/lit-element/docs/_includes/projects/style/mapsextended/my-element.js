import { LitElement, html, css } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import './my-button.js';

class MyElement extends LitElement {

  static get properties() {
    return { 
      alerttype: { type: String },
      myClassMap: { type: Object }
    };
  }

  static styles = css`
    :host {
      font-family: Roboto;
      font-size: 14px; 
    }
    .alert {
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

  firstUpdated() {
    this.myClassMap = {
      alert: true,
      warning: this.alerttype==='warning',
      info: this.alerttype==='info'
    }
  }

  render() {
    return html`
      <div class=${classMap(this.myClassMap)}>
        <slot></slot>
        <my-button alerttype=${this.alerttype}>Ok.</my-button>
      </div>
    `;
  }
}
customElements.define('my-element', MyElement);
