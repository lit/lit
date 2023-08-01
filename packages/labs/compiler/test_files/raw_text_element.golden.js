import { html } from 'lit-html';
const b_1 = i => i;
const lit_template_1 = { h: b_1 `<script>\n  potato;\n</script>`, parts: [] };
// TODO: In the future we can figure out a way to correctly compile raw text
// elements. The complexity is that they depend on creating adjacent Text nodes
// which cannot be represented in the prepared HTML. Thus a binding in a raw
// text node results in the template not being optimized.
const scriptTemplateNoBinding = { ["_$litType$"]: lit_template_1, values: [] };
const lit_template_2 = { h: b_1 `<style>\n  carrot\n</style>`, parts: [] };
const styleTemplateNoBinding = { ["_$litType$"]: lit_template_2, values: [] };
const lit_template_3 = { h: b_1 `<textarea>tomato</textarea>`, parts: [] };
const textareaTemplateNoBinding = { ["_$litType$"]: lit_template_3, values: [] };
const lit_template_4 = { h: b_1 `<title>avocado</title>`, parts: [] };
const titleTemplateNoBinding = { ["_$litType$"]: lit_template_4, values: [] };
const scriptTemplateOneBinding = html `<script>
  ${'potato'};
</script>`;
const styleTemplateOneBinding = html `<style>
  ${'carrot'}
</style>`;
const textareaTemplateOneBinding = html `<textarea>${'tomato'}</textarea>`;
const titleTemplateOneBinding = html `<title>${'avocado'}</title>`;
const scriptTemplateShouldNotBeCompiled = html `<script>
  potato ${'tomato'}
</script>`;
const styleTemplateShouldNotBeCompiled = html `<style>
  ${''} carrot ${''}
</style>`;
const textareaTemplateShouldNotBeCompiled = html `<textarea>
${''}${''}</textarea
>`;
const titleTemplateShouldNotBeCompiled = html `<title>${'one '}${'two'}</title>`;
