import { LitElement, html } from 'lit-element';

/**
 * This element renders its template contents as children, instead of 
 * rendering into a shadow tree.
 */
class LightDom extends LitElement {
  render(){
    return html`
      <p><b>Render root overridden.</b> Template renders without shadow DOM.</p>
    `;
  }
  /**
   * To customize an element's render root, implement createRenderRoot. Return
   * the node into which to render the element's template.
   *
   * This element renders without shadow DOM.
   */
  createRenderRoot(){
    return this;
  }
}
customElements.define('light-dom', LightDom);
