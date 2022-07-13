import {css, html, LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';
import {colors} from '../../utils/theme.styles.js';

@customElement('top-app-bar')
export class TopAppBar extends LitElement {
  render() {
    return html`
      <div id="spacer">
        <header id="floating" part="floating">
          <section id="logo" part="logo">
            <slot name="logo" part="logo-slot"></slot>
          </section>

          <section id="nav" part="nav">
            <slot name="nav" part="nav-slot"></slot>
          </section>

          <section id="controls" part="controls">
            <slot name="controls" part="controls-slot"></slot>
          </section>
        </header>
      </div>
    `;
  }

  static styles = [
    colors,
    css`
      :host {
        display: block;
        height: 56px;
        padding-inline: 16px;
      }

      #spacer,
      #floating {
        height: inherit;
        padding-inline: inherit;
      }

      #floating {
        position: fixed;
        display: flex;
        align-items: center;
        justify-content: space-between;
        inset: 0 0 auto 0;
        background-color: var(--_theme-surface-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'top-app-bar': TopAppBar;
  }
}
