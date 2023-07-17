import {html, nothing} from 'lit-html';
const lit_template_1 = {h: ((i) => i)`<p>Hi</p>`, parts: []};
function outside() {
  function inner() {
    if (true) {
      return {_$litType$: lit_template_1, values: []};
    }
    return nothing;
  }
  return inner();
}
