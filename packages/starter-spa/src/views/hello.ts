import {html} from 'lit';
import {shell} from '../layouts/shell.js';
import '../components/my-button/my-button.js';
import {goto} from '../utils/navigation.js';

export default () => {
  return shell(html`
    <style>
      h1 {
        text-align: center;
        font-size: var(--_theme-typography-font-size-xl);
      }
    </style>
    <h1>Home</h1>
    <section>Welcome to the Lit app starter kit.</section>
    <section>
      Press the following button to programmatically navigate to the
      "Components" page.
      <my-button @click=${(e: Event) => goto(e.target, '/user/User')}
        >Navigate</my-button
      >
    </section>
  `);
};
