import {promisify} from 'util';
import {exec as _exec} from 'child_process';
import {access, rm, readFile, writeFile} from 'fs/promises';

import {
  getBareModuleSpecifiersFromDir,
  getPackageFromSpecifier,
  isLitSpecifier,
  normalizePath,
} from './util.js';

const exec = promisify(_exec);

const usage = `Usage:

npm run import -- path source

- Gist contents will be saved to <lit-monorepo>/playground/p/<path>
  - <path> may be just a directory name or a path with multiple levels
  - You may use the 'p/' prefix, but it is not required
- <source> must be a Gist id or a string (e.g., a URL) containing a Gist id
`;

class Importer {
  #path;
  #source;
  #gistId;
  #originalPackageJSON;
  #explicitDeps;
  #externalExplicitDeps;
  #externalImplicitDeps;

  async import(path, source) {
    if (typeof path !== 'string' || typeof source !== 'string') {
      return console.error(usage);
    }

    this.#path = normalizePath(path);
    this.#source = source;
    this.#gistId = this.#extractGistId(source);

    await this.#cloneGist();

    process.chdir(this.#path);

    await this.#removeGitMetadata();
    await this.#getOriginalPackageJSON();
    await this.#processExplicitDeps();
    await this.#processImplicitDeps();
    await this.#writePackageJSON();
    await this.#npmInstall();
    await this.#installImplicitDeps();
    await this.#writeImportInfo();

    console.log('\nDone.');
  }

  #extractGistId(source) {
    try {
      return source.match(/([0-9a-f]{32}|[0-9a-f]{20})/)[0];
    } catch (e) {
      throw new Error('Source must contain a valid Gist id');
    }
  }

  async #cloneGist() {
    await exec(`git clone git@gist.github.com:${this.#gistId} ${this.#path}`);
  }

  async #removeGitMetadata() {
    await rm('.git', {
      recursive: true,
      force: true,
    });
  }

  async #getOriginalPackageJSON() {
    try {
      await access('package.json');

      this.#originalPackageJSON = JSON.parse(
        await readFile('package.json', {
          encoding: 'utf-8',
        })
      );

      await rm('package.json');
    } catch (e) {
      this.#originalPackageJSON = null;
    }
  }

  async #processExplicitDeps() {
    if (this.#originalPackageJSON) {
      console.log(
        'Checking original package.json for explicit dependencies...\n'
      );

      const explicitDeps = Object.entries({
        ...this.#originalPackageJSON.dependencies,
        ...this.#originalPackageJSON.devDependencies,
      });

      this.#explicitDeps = new Map(explicitDeps);
      this.#externalExplicitDeps = new Map();

      for (const [pkg, version] of this.#explicitDeps) {
        if (isLitSpecifier(pkg)) {
          console.log(`- Skipping ${pkg}`);
        } else {
          console.log(`- Including ${pkg}@${version}`);
          this.#externalExplicitDeps.set(pkg, version);
        }
      }
    } else {
      this.#explicitDeps = new Map();
      this.#externalExplicitDeps = new Map();
    }
  }

  async #processImplicitDeps() {
    console.log('Checking import statements for implicit dependencies...\n');

    const packages = new Set();

    const specifiers = await getBareModuleSpecifiersFromDir();

    for (const specifier of specifiers) {
      packages.add(getPackageFromSpecifier(specifier));
    }

    const implicitDeps = Array.from(packages).filter(
      (pkg) => !this.#explicitDeps.has(pkg)
    );

    this.#externalImplicitDeps = implicitDeps.filter((pkg) => {
      if (isLitSpecifier(pkg)) {
        console.log(`- Skipping ${pkg}`);
        return false;
      } else {
        console.log(`- Including ${pkg}`);
        return true;
      }
    });

    if (implicitDeps.length > 0) {
      console.log();
    }
  }

  async #writePackageJSON() {
    const packageJSON = {};

    if (this.#externalExplicitDeps.size > 0) {
      packageJSON.dependencies = Object.fromEntries(
        Array.from(this.#externalExplicitDeps)
      );
    }

    console.log('Writing package.json...');
    await writeFile('package.json', JSON.stringify(packageJSON, null, 2));
  }

  async #npmInstall() {
    if (this.#externalExplicitDeps.size > 0) {
      console.log('\nRunning npm install...');
      await exec('npm i');
    }
  }

  async #installImplicitDeps() {
    if (this.#externalImplicitDeps.length > 0) {
      console.log('\nImporting implicit dependencies...');
      await exec(`npm i -S ${this.#externalImplicitDeps.join(' ')}`);
    }
  }

  async #writeImportInfo() {
    const info = {
      source: this.#source,
      originalPackageJSON: this.#originalPackageJSON,
    };

    await writeFile('_import.info.json', JSON.stringify(info, null, 2));
  }
}

await new Importer().import(process.argv[2], process.argv[3]);
