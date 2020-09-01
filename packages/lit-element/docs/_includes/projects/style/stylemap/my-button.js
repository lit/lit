import { LitElement, html, css } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';

class MyButton extends LitElement {
  render() { 
    return html`
      <button style=${styleMap({
        backgroundColor: 'blue',
        border: '1px solid black'
      })}>A button</button>
    `;
  }

  //Equivalent: 
  /*
  render() {
    return html`
      <button style="
        background-color:blue;
        border:1px solid black
      ">A button</button>
    `;
  }
  */
}
customElements.define('my-button', MyButton);
