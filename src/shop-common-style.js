import { html } from '../../node_modules/@polymer/lit-element/lit-element.js';

export const shopCommonStyle = html`
<style>

[hidden] {
  display: none !important;
}

header {
  text-align: center;
}

header > h1 {
  margin: 0 0 4px 0;
  font-size: 1.3em;
  font-weight: 500;
}

header > span {
  color: var(--app-secondary-color);
  font-size: 12px;
}

header > shop-button[responsive] {
  margin-top: 20px;
}

@media (max-width: 767px) {

  header > h1 {
    font-size: 1.1em;
  }

}

</style>`;
