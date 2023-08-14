import {html} from 'lit';
// Octal literals are deprecated in JavaScript, and result in an undefined
// entry in the template strings array, clearing out all adjacent content.
// If a template containing one of these invalid octal sequences is accidentally
// compiled, then the text `undefined` will be rendered to the page.
// When uncompiled, a DEV_MODE warning is raised.
// Reference:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Deprecated_octal

// Invalid: octal escape.
html`<p>\2022</p>`;
// Invalid: octal escape.
html`\\\2022`;
// Invalid: \8 and \9 are not allowed in template strings.
html`\9`;
html`\08`;
// Invalid: digit following NULL is invalid octal escape.
html`\03`;
// Invalid: digit following NULLs is invalid octal escape.
html`\000000003`;
// Invalid: Odd number of slashes and null characters will not save you:
html`\\\\\\\\\\\\\\\\\\\\\\\\\000000000000000000000000000000000000000004`;
// Valid: backslash was escaped, this is just text.
html`valid:\\2022`;
// Valid NULL character as it isn't followed by a digit.
html`valid\0`;
