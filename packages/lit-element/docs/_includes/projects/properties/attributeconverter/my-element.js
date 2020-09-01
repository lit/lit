import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {
  static get properties() { return {
    myProp: {
      reflect: true,
      converter: {
        toAttribute(value) {
          console.log('myProp\'s toAttribute.');
          console.log('Processing:', value, typeof(value));
          let retVal = String(value);
          console.log('Returning:', retVal, typeof(retVal));
          return retVal;
        },

        fromAttribute(value) {
          console.log('myProp\'s fromAttribute.');
          console.log('Processing:', value, typeof(value));
          let retVal = Number(value);
          console.log('Returning:', retVal, typeof(retVal));
          return retVal;
        }
      }
    },

    theProp: {
      reflect: true,
      converter(value) {
        console.log('theProp\'s converter.');
        console.log('Processing:', value, typeof(value));

        let retVal = Number(value);
        console.log('Returning:', retVal, typeof(retVal));
        return retVal;
      }},
  };}

  constructor() {
    super();
    this.myProp = 'myProp';
    this.theProp = 'theProp';
  }

  attributeChangedCallback(name, oldval, newval) {
    // console.log('attribute change: ', name, newval);
    super.attributeChangedCallback(name, oldval, newval);
  }

  render() {
    return html`
      <p>myProp ${this.myProp}</p>
      <p>theProp ${this.theProp}</p>

      <button @click="${this.changeProperties}">change properties</button>
      <button @click="${this.changeAttributes}">change attributes</button>
    `;
  }

  changeAttributes() {
    let randomString = Math.floor(Math.random()*100).toString();
    this.setAttribute('myprop', 'myprop ' + randomString);
    this.setAttribute('theprop', 'theprop ' + randomString);
    this.requestUpdate();
  }

  changeProperties() {
    let randomString = Math.floor(Math.random()*100).toString();
    this.myProp='myProp ' + randomString;
    this.theProp='theProp ' + randomString;
  }
}
customElements.define('my-element', MyElement);
