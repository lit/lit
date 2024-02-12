# ignition README

Ignition is a prototype VS Code extension that augments component development
with visual introspection and editing.

### Code-to-output understanding

Ignition's core features are based on the ability to associate code with its
output. Ignition uses a combination of static analysis, code transformation, and
runtime introspection to be able to determine which templates and styles have
produced and styles any specific DOM, and vice-versa.

The will enable features like:

- Jumping to the exact element in a template from
  an element rendered from that template in a live preview.
- Highlighting the DOM created from a template in a live preview, when hovering
  over the template.
- Editing styles in a devtools-like interface and modifying the CSS source that
  produced that style.

## Local development

For local development, the extension must be run in its own window. The
"Run Ignition" launch will build the extension and open a new VS Code window.

Then you ust open a project to use the extension with. Make sure you use the
"Add folder to workspace" option so that the folder is opened in the extension
development window.

Ignition adds a "Hello Ignition" command that you can use to check that the
extension is loaded. You can see logs in the "Extension Host" console output.

Ignition's main interface is a custom text editor for .ts files. If you select
a .ts file that defines a custom element, Ignition's editor will launch and
show a simple story preview for the element.

## Features

## Requirements

## Extension Settings

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
