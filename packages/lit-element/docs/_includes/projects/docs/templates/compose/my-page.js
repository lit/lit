import { LitElement, html } from 'lit-element';

function headerTemplate(title) {
  return html`<header>${title}</header>`;
}
function articleTemplate(text) {
  return html`<article>${text}</article>`;
}
function footerTemplate() {
  return html`<footer>Your footer here.</footer>`;
}

class MyPage extends LitElement {
  static get properties() {
    return {
      article: {
        attribute: false,
      },
    };
  }

  constructor() {
    super();
    this.article = {
      title: 'My Nifty Article',
      text: 'Some witty text.',
    };
  }

  render() {
    return html`
      ${headerTemplate(this.article.title)}
      ${articleTemplate(this.article.text)} 
      ${footerTemplate()}
    `;
  }
}
customElements.define('my-page', MyPage);
