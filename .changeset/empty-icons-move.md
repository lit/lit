---
'@lit-labs/cli': patch
---

Use a shell when spawning a child process to install packages. This fixes an error that would happen when command is run in Windows with the latest Node.js security fix in v21.7.3.
