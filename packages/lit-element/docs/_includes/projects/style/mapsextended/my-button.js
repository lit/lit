import { LitElement, html, css } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';

const defaultStyleMap = {
  display: 'block',
  backgroundColor: 'lightgray',
  fontSize: '14px',
  border: '1px solid black',
  padding: '12px', 
  margin: '12px' 
};

const optionalStyleMaps = {
  info: { 
    backgroundColor: 'lightblue',
    border: '1px solid blue'
  },
  warning: { 
    backgroundColor: 'pink',
    border: '1px solid red'
  }
}

class MyButton extends LitElement {

  static get properties() {
    return { 
      alerttype: { type: String },
      myStyleMap: { type: Object } 
    };
  }

  firstUpdated() {
    this.myStyleMap = Object.assign({}, 
      defaultStyleMap, 
      optionalStyleMaps[this.alerttype]);
  }

  render() {
    return html`
      <button style=${styleMap(this.myStyleMap)}>
        <slot></slot>
      </button>
    `;
  }
}
customElements.define('my-button', MyButton);
