import {readdir, copyFile, mkdir} from 'fs/promises';
import {join} from 'path';
import {normalizePath} from './util.js';

const usage = `
Usage:

npm run new -- path

- A new playground will be created at <lit-monorepo>/playground/p/<path>
  - <path> may be just a directory name or a path with multiple levels
  - You may use the 'p/' prefix, but it is not required
`;

async function newPlayground(path) {
  if (typeof path !== 'string') {
    return console.error(usage);
  }

  const sourceDir = './scripts/template';
  const destDir = normalizePath(path);

  // Create the destination directory
  await mkdir(destDir, {recursive: true});

  // Read the contents of the source directory
  const files = await readdir(sourceDir);

  // Copy each file to the destination directory
  for (const file of files) {
    const sourceFile = join(sourceDir, file);
    const destFile = join(destDir, file);
    await copyFile(sourceFile, destFile);
  }
}

await newPlayground(process.argv[2]);
