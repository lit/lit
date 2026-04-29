import {html} from 'lit-html';
// TODO: In the future we can figure out a way to correctly compile raw text
// elements. The complexity is that they depend on creating adjacent Text nodes
// which cannot be represented in the prepared HTML. Thus a binding in a raw
// text node results in the template not being optimized.
const scriptTemplateNoBinding = html`<script>
  potato;
</script>`;
const styleTemplateNoBinding = html`<style>
  carrot
</style>`;
const textareaTemplateNoBinding = html`<textarea>tomato</textarea>`;
const titleTemplateNoBinding = html`<title>avocado</title>`;

const scriptTemplateOneBinding = html`<script>
  ${'potato'};
</script>`;
const styleTemplateOneBinding = html`<style>
  ${'carrot'}
</style>`;
const textareaTemplateOneBinding = html`<textarea>${'tomato'}</textarea>`;
const titleTemplateOneBinding = html`<title>${'avocado'}</title>`;

const scriptTemplateShouldNotBeCompiled = html`<script>
  potato ${'tomato'}
</script>`;
const styleTemplateShouldNotBeCompiled = html`<style>
  ${''} carrot ${''}
</style>`;
const textareaTemplateShouldNotBeCompiled = html`<textarea>
${''}${''}</textarea
>`;
const titleTemplateShouldNotBeCompiled = html`<title>${'one '}${'two'}</title>`;
