/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {spawn} from 'child_process';

export type InstallOptions = {
  description: string;
  npmPackage: string;
  global: boolean;
  cwd: string;
  stdin: NodeJS.ReadableStream;
  console: Console;
};

export const installDepWithPermission = async ({
  description,
  npmPackage,
  global,
  cwd,
  stdin,
  console,
}: InstallOptions): Promise<boolean> => {
  const havePermission = await getPermissionToInstall(
    description,
    npmPackage,
    stdin,
    console
  );
  if (!havePermission) {
    return false;
  }
  console.log('Installing...');
  const npmArgs = ['install', '--save-dev', npmPackage];
  if (global) {
    npmArgs.push('-g');
  }
  const child = await spawn(
    // https://stackoverflow.com/questions/43230346/error-spawn-npm-enoent
    /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
    npmArgs,
    {
      cwd,
      stdio: [process.stdin, 'pipe', 'pipe'],
    }
  );
  (async () => {
    for await (const line of child.stdout) {
      console.log(line.toString());
    }
  })();
  (async () => {
    for await (const line of child.stderr) {
      console.error(line.toString());
    }
  })();
  const succeeded = await new Promise<boolean>((resolve) => {
    child.on('exit', (code) => {
      resolve(code === 0);
    });
    child.on('error', (err) => {
      console.error(`Error installing dependency: ${err}`);
      resolve(false);
    });
  });
  return succeeded;
};

const getPermissionToInstall = async (
  description: string,
  npmPackage: string,
  stdin: NodeJS.ReadableStream,
  console: Console
): Promise<boolean> => {
  console.log(`${description} is not installed.
Run 'npm install --save-dev ${npmPackage}'? [Y/n]`);
  // read a line from this.stdin
  const line = await new Promise<string>((resolve) => {
    const closeHandler = (data: unknown) => {
      if (data) {
        resolve(String(data));
      } else {
        resolve('');
      }
    };
    stdin.once('close', closeHandler);
    stdin.once('data', (data: unknown) => {
      resolve(String(data));
      stdin.removeListener('close', closeHandler);
    });
  });
  return line === '\n' || line.trim().toLowerCase() === 'y';
};
