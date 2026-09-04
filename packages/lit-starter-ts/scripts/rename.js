/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Rename the my-element component to a new name.
 *
 * Usage: node scripts/rename.js <new-name>
 *
 * Example: node scripts/rename.js my-awesome-element
 */
function rename(newName) {
  const oldName = 'my-element';

  // Validate the new name
  if (!newName || newName.trim() === '') {
    console.error('Error: Please provide a valid name.');
    console.log('Usage: node scripts/rename.js <new-name>');
    process.exit(1);
  }

  if (newName.includes(' ')) {
    console.error('Error: The name cannot contain spaces.');
    console.log('Usage: node scripts/rename.js <new-name>');
    process.exit(1);
  }

  if (!/^[a-z][a-z0-9-]*$/.test(newName)) {
    console.error(
      'Error: The name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens.'
    );
    console.log('Usage: node scripts/rename.js <new-name>');
    process.exit(1);
  }

  if (newName === oldName) {
    console.log('The name is already "' + oldName + '". Nothing to do.');
    return;
  }

  console.log(`Renaming "${oldName}" to "${newName}"...`);

  // Step 1: Global find and replace in source files
  execSync(
    `grep -rl "${oldName}" --include="*.ts" --include="*.js" --include="*.json" --include="*.html" --include="*.md" . | xargs sed -i 's/${oldName}/${newName}/g'`,
    {cwd: projectRoot}
  );

  // Step 2: Rename source file
  const oldSrcFile = path.join(projectRoot, 'src', `${oldName}.ts`);
  const newSrcFile = path.join(projectRoot, 'src', `${newName}.ts`);
  if (fs.existsSync(oldSrcFile)) {
    fs.renameSync(oldSrcFile, newSrcFile);
    console.log(`Renamed ${oldSrcFile} -> ${newSrcFile}`);
  }

  // Step 3: Rename test file
  const oldTestFile = path.join(
    projectRoot,
    'src',
    'test',
    `${oldName}_test.ts`
  );
  const newTestFile = path.join(
    projectRoot,
    'src',
    'test',
    `${newName}_test.ts`
  );
  if (fs.existsSync(oldTestFile)) {
    fs.renameSync(oldTestFile, newTestFile);
    console.log(`Renamed ${oldTestFile} -> ${newTestFile}`);
  }

  // Step 4: Rename index.html reference if needed
  const indexHtml = path.join(projectRoot, 'index.html');
  if (fs.existsSync(indexHtml)) {
    let content = fs.readFileSync(indexHtml, 'utf-8');
    if (content.includes(oldName)) {
      content = content.replace(new RegExp(oldName, 'g'), newName);
      fs.writeFileSync(indexHtml, content);
      console.log(`Updated index.html`);
    }
  }

  // Step 5: Update package.json name if it exists
  const packageJson = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    if (pkg.name === `@lit-labs/${oldName}`) {
      pkg.name = `@lit-labs/${newName}`;
      fs.writeFileSync(packageJson, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`Updated package.json name to @lit-labs/${newName}`);
    }
  }

  console.log('');
  console.log('Done! Remember to:');
  console.log('1. Review the changes with `git diff`');
  console.log('2. Run `npm install` if package.json name was changed');
  console.log('3. Run `npm test` to verify everything works');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/rename.js <new-name>');
  console.log('');
  console.log('Example: node scripts/rename.js my-awesome-element');
  process.exit(1);
}

rename(args[0]);
