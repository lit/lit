import {html} from 'lit-html';
import {msg} from './tsout/localization';

export const a = msg('a', 'Hello World!');
export const b = msg('b', html`Hello <b>World!</b>`);
