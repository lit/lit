import {html, TemplateResult} from 'lit';
import '../components/top-app-bar/top-app-bar.js';
import '../components/tabs/my-tabs.js';
import '../components/tabs/my-tab.js';
import {styles} from './shell.styles.js';
import {tabs} from './tabs.js';
import {ref} from 'lit/directives/ref.js';
import type {DarkModeToggle} from 'dark-mode-toggle';

export const shell = (content: TemplateResult) => {
  return html`
    ${styles}
    <div class="outside">
      <div class="top-app-bar">
        <top-app-bar>
          <a href="/" slot="logo">
            <svg class="logo" viewBox="0 0 160 200">
              <title>Lit Logo</title>
              <path
                d="M80 0L40 40v80l40-40V0zm0 80v80l40-40V40L80 80zm40 40v80l40-40V80l-40 40zm-80 0L0 80v80l40 40v-80z"
              />
            </svg>
          </a>
          <dark-mode-toggle
            @colorschemechange=${onColorSchemeChange}
            permanent
            slot="controls"
            ${ref(() => {
              import('dark-mode-toggle');
            })}
          ></dark-mode-toggle>
          <my-tabs slot="nav"> ${tabs()} </my-tabs>
        </top-app-bar>
      </div>
      <div class="content">
        <main aria-live="assertive">${content}</main>
      </div>
    </div>
  `;
};

const onColorSchemeChange = (e: Event) => {
  const toggleEl = e.target as DarkModeToggle;
  document.body.classList.toggle('dark', toggleEl.mode === 'dark');
};
