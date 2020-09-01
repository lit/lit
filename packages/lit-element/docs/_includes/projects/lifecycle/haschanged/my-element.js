import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() { return {
    myProp: {
      type: Number,

      /**
       * Compare myProp's new value with its old value.
       *
       * Only consider myProp to have changed if newVal is larger than
       * oldVal.
       */
      hasChanged(newVal, oldVal) {
        if (newVal > oldVal) {
          console.log(`${newVal} > ${oldVal}. hasChanged: true.`);
          return true;
        }
        else {
          console.log(`${newVal} <= ${oldVal}. hasChanged: false.`);
          return false;
        }
      }
    }};
  }

  constructor() {
    super();
    this.myProp = 1;
  }

  render() {
    return html`
      <p>${this.myProp}</p>
      <button @click="${this.getNewVal}">get new value</button>
    `;
  }

  updated() {
    console.log('updated');
  }

  getNewVal() {
    let newVal = Math.floor(Math.random()*10);
    this.myProp = newVal;
  }

}
customElements.define('my-element', MyElement);
