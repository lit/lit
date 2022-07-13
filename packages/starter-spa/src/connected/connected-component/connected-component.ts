import {html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {cardStyles} from '../../components/sharable-component/sharable-component.js';

@customElement('connected-component')
export class ConnectedComponent extends LitElement {
  render() {
    return html`
      <div>
        This component is a "connected" component because it does a fetch that
        is specific to this application.
      </div>
    `;
  }

  static styles = cardStyles;
}

declare global {
  interface HTMLElementTagNameMap {
    'connected-component': ConnectedComponent;
  }
}
