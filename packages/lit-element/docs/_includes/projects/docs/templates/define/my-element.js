import { LitElement, html } from 'lit-element';

class MyElement extends LitElement {

  // Implement `render` to define a template for your element.
  render(){
    /**
     * Return a lit-html `TemplateResult`.
     *
     * To create a `TemplateResult`, tag a JavaScript template literal
     * with the `html` helper function.
     */
    return html`
      <div>
        <p>A paragraph</p>
      </div>
    `;
  }
}
customElements.define('my-element', MyElement);
