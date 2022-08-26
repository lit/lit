import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

export const generateNpmignore = (): FileTree => {
  return {
    '.npmignore': `node_modules
.vscode
README.md
index.html
src`,
  };
};
