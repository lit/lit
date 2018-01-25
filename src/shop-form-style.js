import { html } from '../../node_modules/@polymer/lit-element/lit-element.js';

export const shopFormStyle = html`
<style>

:host {
  display: block;
}

.main-frame {
  margin: 0 auto;
  padding: 0 24px 48px 24px;
  max-width: 900px;
  overflow: hidden;
}

.empty-cart {
  text-align: center;
  white-space: nowrap;
  color: var(--app-secondary-color);
}

h2 {
  font-size: 13px;
}

</style>`;
