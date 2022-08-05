import {html} from 'lit';
import {shell} from '../../layouts/shell.js';
import '../../components/my-button/my-button.js';
import {goto} from '../../utils/navigation.js';

interface UserParams {
  user: string;
}

export default (params: UserParams) => {
  return shell(html`
    Hello ${params.user}
    <my-button @click=${(e: Event) => goto(e.target, '/user/asdf')}
      >Navigate</my-button
    >
  `);
};
