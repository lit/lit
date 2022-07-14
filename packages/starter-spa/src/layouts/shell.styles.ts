import {html} from 'lit';

export const styles = html` <style>
  :host,
  .content,
  .outside {
    min-height: 100%;
    box-sizing: border-box;
    display: flex;
    --dark-mode-toggle-light-icon: url("data:image/svg+xml,%0A%3Csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' viewBox='0 0 48 48' %3E%3Cpath fill='black' d='M24 31q2.9 0 4.95-2.05Q31 26.9 31 24q0-2.9-2.05-4.95Q26.9 17 24 17q-2.9 0-4.95 2.05Q17 21.1 17 24q0 2.9 2.05 4.95Q21.1 31 24 31Zm0 3q-4.15 0-7.075-2.925T14 24q0-4.15 2.925-7.075T24 14q4.15 0 7.075 2.925T34 24q0 4.15-2.925 7.075T24 34ZM3.5 25.5q-.65 0-1.075-.425Q2 24.65 2 24q0-.65.425-1.075Q2.85 22.5 3.5 22.5h5q.65 0 1.075.425Q10 23.35 10 24q0 .65-.425 1.075-.425.425-1.075.425Zm36 0q-.65 0-1.075-.425Q38 24.65 38 24q0-.65.425-1.075.425-.425 1.075-.425h5q.65 0 1.075.425Q46 23.35 46 24q0 .65-.425 1.075-.425.425-1.075.425ZM24 10q-.65 0-1.075-.425Q22.5 9.15 22.5 8.5v-5q0-.65.425-1.075Q23.35 2 24 2q.65 0 1.075.425.425.425.425 1.075v5q0 .65-.425 1.075Q24.65 10 24 10Zm0 36q-.65 0-1.075-.425-.425-.425-.425-1.075v-5q0-.65.425-1.075Q23.35 38 24 38q.65 0 1.075.425.425.425.425 1.075v5q0 .65-.425 1.075Q24.65 46 24 46ZM12 14.1l-2.85-2.8q-.45-.45-.425-1.075.025-.625.425-1.075.45-.45 1.075-.45t1.075.45L14.1 12q.4.45.4 1.05 0 .6-.4 1-.4.45-1.025.45-.625 0-1.075-.4Zm24.7 24.75L33.9 36q-.4-.45-.4-1.075t.45-1.025q.4-.45 1-.45t1.05.45l2.85 2.8q.45.45.425 1.075-.025.625-.425 1.075-.45.45-1.075.45t-1.075-.45ZM33.9 14.1q-.45-.45-.45-1.05 0-.6.45-1.05l2.8-2.85q.45-.45 1.075-.425.625.025 1.075.425.45.45.45 1.075t-.45 1.075L36 14.1q-.4.4-1.025.4-.625 0-1.075-.4ZM9.15 38.85q-.45-.45-.45-1.075t.45-1.075L12 33.9q.45-.45 1.05-.45.6 0 1.05.45.45.45.45 1.05 0 .6-.45 1.05l-2.8 2.85q-.45.45-1.075.425-.625-.025-1.075-.425ZM24 24Z'/%3E%3C/svg%3E");
    --dark-mode-toggle-dark-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24px' height='24px' viewBox='0 0 48 48' %3E%3Cpath fill='white' d='M24 42q-7.5 0-12.75-5.25T6 24q0-7.5 5.25-12.75T24 6q.4 0 .85.025.45.025 1.15.075-1.8 1.6-2.8 3.95-1 2.35-1 4.95 0 4.5 3.15 7.65Q28.5 25.8 33 25.8q2.6 0 4.95-.925T41.9 22.3q.05.6.075.975Q42 23.65 42 24q0 7.5-5.25 12.75T24 42Zm0-3q5.45 0 9.5-3.375t5.05-7.925q-1.25.55-2.675.825Q34.45 28.8 33 28.8q-5.75 0-9.775-4.025T19.2 15q0-1.2.25-2.575.25-1.375.9-3.125-4.9 1.35-8.125 5.475Q9 18.9 9 24q0 6.25 4.375 10.625T24 39Zm-.2-14.85Z'/%3E%3C/svg%3E");
    --dark-mode-toggle-icon-size: 24px;
  }

  .content {
    height: auto;
    display: block;
    border: 1px solid var(--_theme-on-surface-color);
    border-block-end: none;
    padding: 16px;
    border-radius: var(--_theme-shape-border-radius-xl)
      var(--_theme-shape-border-radius-xl) 0 0;
    width: 100%;
    max-width: 1440px;
    width: 80%;
    min-width: 480px;
  }

  .outside {
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  a[slot='logo'] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
  }

  .logo {
    width: 24px;
    fill: var(--logo-color, #324fff);
  }

  top-app-bar::part(nav),
  top-app-bar::part(nav-slot) {
    height: 100%;
    display: flex;
    align-items: end;
  }

  my-tabs {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  dark-mode-toggle {
    display: inline-flex;
  }

  dark-mode-toggle::part(toggleLabel) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    position: relative;
    z-index: 0;
    border-radius: 50%;
  }

  dark-mode-toggle::part(aside),
  dark-mode-toggle::part(fieldset) {
    padding: 0;
    margin: 0;
  }

  dark-mode-toggle:not(:defined) {
    display: block;
    width: 48px;
    height: 48px;
  }

  dark-mode-toggle::part(toggleLabel)::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-color: var(--_theme-on-surface-color);
    opacity: 0;
    z-index: -1;
  }

  dark-mode-toggle::part(toggleLabel):hover::after {
    opacity: var(--_theme-state-opacity-hover);
  }

  dark-mode-toggle:focus-within::part(toggleLabel)::after {
    opacity: var(--_theme-state-opacity-focus);
  }

  dark-mode-toggle::part(toggleLabel):active::after {
    opacity: var(--_theme-state-opacity-press);
  }
</style>`;
