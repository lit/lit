# ignition README

The Lit VS Code extension adds Lit syntax highlighting, code completion,
type-checking, and other IntelliSense features to VS Code and compatible IDEs.

## Local development

For local development, the extension must be run in its own window. The "Run Lit
VS Code Extension" launch will build the extension and open a new VS Code
window.

Then you open a project to use the extension with. Make sure you use the File >
"Add folder to workspace..." menu so that the folder is opened in the extension
development window. Using the "Open Folder" button in the extension development
window will unfortunately open the folder in a plain window without the local
extension running.

The Lit Extension adds a "Hello Lit" command that you can use to check that the
extension is loaded. Running the command should show a "Hello from Lit!"
message in a toast and log a nessage to the "Lit" log.

### Logs

Logs are important for extension development. You can see the logs in the Output
tab of the VS Code panel. There's a dropdown with available logs. Useful logs
are "Lit", "Extension Host", and "Window". If things aren't working look for
exceptions in these logs.

### Rebuilding

For some reason the build script is not updating the output files when run while
the extension is running. This could be a conflict from multiple invocations
of Wireit - one via tasks.json and one from a commandline. Unfortunately that
means you have to close the extension development window to load a new build.

When this is fixed, then you should be able to run the "Developer: Reload
Window" command to load a new build of the extension or its dependencies.

## Features

## Extension Settings

---

## Extension guidelines

Make that you've read through the extensions guidelines.

- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
