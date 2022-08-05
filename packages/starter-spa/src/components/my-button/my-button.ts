import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {colors, typography, states, shape} from '../../utils/theme.styles.js';

@customElement('my-button')
export class MyButton extends LitElement {
  render() {
    return html` <button><slot></slot></button>`;
  }
  static styles = [
    colors,
    shape,
    states,
    typography,
    css`
      button {
        border-radius: var(--_theme-shape-border-radius-sm);
        background-color: var(--_theme-primary-color);
        color: var(--_theme-on-primary-color);
        font-family: var(--_theme-typography-font-family);
        padding: 8px;
        border: none;
        margin: 8px;
        position: relative;
        z-index: 0;
        box-sizing: border-box;
        cursor: pointer;
        font-size: inherit;
      }

      button::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        opacity: 0;
        background-color: var(--_theme-on-primary-color);
        border-radius: inherit;
      }

      button:hover::before {
        opacity: var(--_theme-state-opacity-hover);
      }

      button:focus::before {
        opacity: var(--_theme-state-opacity-focus);
      }

      button:active::before {
        opacity: var(--_theme-state-opacity-press);
      }
    `,
  ];
}
