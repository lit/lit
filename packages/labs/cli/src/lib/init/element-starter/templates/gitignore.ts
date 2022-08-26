import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';

export const generateGitignore = (): FileTree => {
  return {
    '.gitignore': `node_modules
lib`,
  };
};
