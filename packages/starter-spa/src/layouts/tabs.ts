import {html} from 'lit';

export const tabs = () => {
  const path = window.location.pathname;
  return html`
    <my-tab href="/" label="Home" .selected=${path === '/'}> </my-tab>
    <my-tab
      href="/user/User"
      label="Routing"
      .selected=${path.startsWith('/user/')}
    >
    </my-tab>
    <my-tab
      href="/components"
      label="Components"
      .selected=${path.startsWith('/components')}
    >
    </my-tab>
  `;
};
