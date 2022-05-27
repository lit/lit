import {javascript} from '@lit-labs/gen-utils/lib/str-utils.js';

export const renameTemplate = () =>
  javascript`const fs = require('fs');
const root = \`\${__dirname}/..\`;
const files = fs.readdirSync(root);
for (const file of files) {
  if (file.endsWith('.vue.d.ts')) {
    fs.renameSync(
      \`\${root}/\${file}\`,
      \`\${root}/\${file.replace('.vue.d.ts', '.d.ts')}\`,
      (err) => {
        console.log(err)
      }
    )
  }
}
`;
