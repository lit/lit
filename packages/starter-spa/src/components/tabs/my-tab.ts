import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {colors, shape, states, typography} from '../../utils/theme.styles.js';

@customElement('my-tab')
export class MyTab extends LitElement {
  @property() href = '';
  @property() label = '';
  @property({type: Boolean}) selected = false;

  render() {
    const content =
      this.href && !this.selected ? this.renderAnchor() : this.renderDiv();
    const classes = this.getRootClasses();

    return html`<li id="root" class=${classMap(classes)}>${content}</li>`;
  }

  protected renderAnchor() {
    return html` <a id="anchor" href=${this.href}>${this.renderLabel()}</a> `;
  }

  protected renderDiv() {
    return html` <div id="anchor">${this.renderLabel()}</div> `;
  }

  protected renderLabel() {
    return html`<span id="underbar"><span>${this.label}</span></span>`;
  }

  protected getRootClasses() {
    return {
      selected: this.selected,
    };
  }

  static styles = [
    colors,
    states,
    typography,
    shape,
    css`
      :host,
      a {
        color: var(--_theme-primary-color);
        font-size: var(--_theme-typography-font-size-md);
        text-decoration: none;
      }

      :host {
        min-width: 100px;
        height: 48px;
      }

      #root,
      #anchor {
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
      }

      #root {
        position: relative;
        z-index: 0;
      }

      #root::before {
        content: '';
        position: absolute;
        inset: 0;
        background-color: var(--_theme-primary-color);
        pointer-events: none;
        z-index: -1;
        opacity: 0;
      }

      #root:hover::before {
        opacity: var(--_theme-state-opacity-hover);
      }

      #root:focus-within::before {
        opacity: var(--_theme-state-opacity-focus);
      }

      #root:active::before {
        opacity: var(--_theme-state-opacity-press);
      }

      #root.selected #underbar::after {
        content: '';
        position: absolute;
        inset-block-end: 0;
        width: 100%;
        height: var(--_theme-shape-border-radius-sm);
        background-color: var(--_theme-primary-color);
        border-radius: var(--_theme-shape-border-radius-sm)
          var(--_theme-shape-border-radius-sm) 0 0;
      }

      #underbar {
        display: inline-flex;
        align-items: center;
        position: relative;
        height: 100%;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'my-tab': MyTab;
  }
}
