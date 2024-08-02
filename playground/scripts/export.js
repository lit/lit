import {promisify} from 'util';
import {join} from 'path';
import {copyFile, mkdir, readdir, rm, stat} from 'fs/promises';
import {exec as _exec} from 'child_process';
import {normalizePath} from './util.js';

const exec = promisify(_exec);

const usage = `Usage:

npm run export -- path

- <path> must be a path to a directory beneath <lit-monorepo>/playground/p
  - You may use the 'p/' prefix, but it is not required
- Prerequisite: Install https://github.com/defunkt/gist
`;

async function exportPlayground(path) {
  if (typeof path !== 'string') {
    return console.error(usage);
  }

  path = normalizePath(path);

  // Copy the contents of the directory to a temporary directory,
  // excluding the package.json file and any nested directories

  const sourceDir = `./${path}`;
  const tempDir = `./_temp`;

  try {
    await rm(tempDir, {recursive: true});
  } catch (e) {
    // Ignore errors if the directory doesn't exist
  }

  await mkdir(tempDir, {recursive: true});

  const files = (await readdir(sourceDir)).filter(
    (file) => !['package.json', 'package-lock.json'].includes(file)
  );

  for (const file of files) {
    const sourceFile = join(sourceDir, file);
    const isDirectory = (await stat(sourceFile)).isDirectory();
    if (!isDirectory) {
      const destFile = join(tempDir, file);
      await copyFile(sourceFile, destFile);
    }
  }

  // Create a Gist from the temporary directory using the gist CLI

  const {stdout} = await exec(`gist -p ${tempDir}/*.*`);
  const gistId = stdout.split('/').at(-1);

  // Delete the temporary directory

  await rm(tempDir, {recursive: true});

  console.log(stdout);
  console.log(`https://lit.dev/playground/#gist=${gistId}`);
}

await exportPlayground(process.argv[2]);
