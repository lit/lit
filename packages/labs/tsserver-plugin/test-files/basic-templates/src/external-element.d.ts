import {LitElement} from 'lit';

declare class ExternalElement extends LitElement {
  value: number;
}

declare global {
  interface HTMLElementTagNameMap {
    'external-element': ExternalElement;
  }
}
