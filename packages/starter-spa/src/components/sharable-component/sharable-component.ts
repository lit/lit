import {css, html, LitElement} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {colors, shape, states, typography} from '../../utils/theme.styles.js';

import '../my-button/my-button.js';

export const cardStyles = [
  colors,
  shape,
  css`
    :host {
      display: block;
      border-radius: var(--_theme-shape-border-radius-md);
      border-width: 1px;
      border-style: solid;
      border-color: var(--_theme-outline-color);
      margin: 16px;
      padding: 16px;
    }
  `,
];

@customElement('sharable-component')
export class SharableComponent extends LitElement {
  @state() count = 0;

  render() {
    return html`
      <div>
        This component is a "sharable" component because it does nothing that is
        specific to this application, and can be shared across projects.
      </div>
      <my-button @click=${() => this.count++}>Click to increment</my-button>
      <hr />
      <div>Count: ${this.count}</div>
    `;
  }

  static styles = [
    ...cardStyles,
    states,
    typography,
    css`
      hr {
        border-color: var(--_theme-outline-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'sharable-component': SharableComponent;
  }
}
