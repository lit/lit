import { html, nothing } from 'lit-html';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<p>Hi</p>`, parts: [] };
function outside() {
    function inner() {
        if (true) {
            return { ["_$litType$"]: lit_template_1, values: [] };
        }
        return nothing;
    }
    return inner();
}
