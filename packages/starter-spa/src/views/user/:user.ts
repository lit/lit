import {html} from 'lit';
import {shell} from '../../layouts/shell.js';
import {goto} from '../../utils/navigation.js';
import '../../components/my-button/my-button.js';

interface UserParams {
  user: string;
}

export default (params: UserParams) => {
  return shell(html`
    Hello ${params.user}
    <my-button @click=${() => goto('/user/asdf')}>Navigate</my-button>
  `);
};
