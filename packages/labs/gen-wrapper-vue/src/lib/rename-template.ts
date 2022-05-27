import {javascript} from '@lit-labs/gen-utils/lib/str-utils.js';

export const renameTemplate = () =>
  javascript`import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = \`\${__dirname}/..\`;
const files = fs.readdirSync(root);
for (const file of files) {
  if (file.endsWith('.vue.d.ts')) {
    fs.renameSync(
      \`\${root}/\${file}\`,
      \`\${root}/\${file.replace('.vue.d.ts', '.d.ts')}\`,
      (err) => {
        console.log(err);
      }
    )
  }
}
`;
