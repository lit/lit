import {html} from 'lit-html';
const attributePart = html`<div data-attr="${'attributeValue'}"></div>`;

const multipleAttributeParts = html`<div
  data-attr="static ${'value-one'} middle ${'value-two'} end"
></div>`;
const noQuotes = html`<div data-attr=${'no-quotes-value'}></div>`;
