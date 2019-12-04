// Import the LitElement base class and html tag function
import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {

  static get properties() {
    return {
      name: {type: String}
    }
  }

  constructor() {
    super();
    this.name = 'World';
  }


  /**
   * Implement `render` to define a template for your element.
   *
   * You must provide an implementation of `render` for any element
   * that uses LitElement as a base class.
   */
  render(){
    /**
     * `render` must return a lit-html `TemplateResult`.
     *
     * To create a `TemplateResult`, tag a JavaScript template literal
     * with the `html` tag function:
     */
    return html`
      <p>Hello, ${this.name}!</p>
    `;
  }
}

customElements.define('my-element', MyElement);
