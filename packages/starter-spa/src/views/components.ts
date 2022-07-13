import {html} from 'lit';
import {shell} from '../layouts/shell.js';
import '../components/sharable-component/sharable-component.js';
import '../connected/connected-component/connected-component.js';

export default () => {
  return shell(html`
    <sharable-component></sharable-component>
    <connected-component></connected-component>
  `);
};
