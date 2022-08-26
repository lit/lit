import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {Language} from '../../../commands/init.js';

export const generateGitignore = (lang: Language): FileTree => {
  return {
    '.gitignore': `node_modules${
      lang !== 'ts'
        ? ''
        : `
lib`
    }`,
  };
};
