# Repository Technical Context

This repository is a monorepo that uses Lit for building web components and no other frontend frameworks unless otherwise specified.

## Coding Patterns

- Uses standard ESM imports
- TypeScript imports end with `.js` extension
- Decorators are used, but other TypeScript features that are not standard JavaScript are avoided
- Focuses on native, modern browser features, including custom elements, Shadow DOM, and css custom properties.

## Build System

- Google Wireit orchestrates npm scripts
- Wireit script configurations:
  - Declare file inputs and outputs
  - Specify script dependencies
  - Cache build artifacts in `.wireit` directories
  - Prepending `WIREIT_LOGGER=simple npm run <command>` outputs the full logs to the console
