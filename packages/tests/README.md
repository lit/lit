# Tests

This package conducts tests in the Lit monorepo.

## Overview

Lit uses [mocha](https://mochajs.org/) to compose tests and [web test runner](https://modern-web.dev/docs/test-runner/) to run them.

Tests are dispatched locally with [Playwright](https://playwright.dev/)
and remotely with [Saucelabs](https://saucelabs.com/).

## Configurations

The local and remote configurations share a baseline set
of web test runner properties found in `wtr-config.js`.

Properties specific to local and remote environments inherit and override the baseline
configuration.

Local tests use the `web-test-runner.config.js` configuration. Remote tests use
the `web-test-runner.saucelabs.config.js` configuration.

## Usage

All test runs share the following env variables:

```bash
BROWSERS=<browser-type>
CONCURRENT_BROWSERS=<number-browsers-running-at-same-time>
CONCURRENT_FRAMES=<num-of-tests-run-in-iframes>
```

Declare the variables above to control concurrency and browser types.

For example, the following env variables will run 3 tests in two browsers at the
same time, totalling in a maximum of 6 concurrent tests.

```
BROWSERS=preset:local
CONCURRENT_BROWSERS=2
CONCURRENT_FRAMES=3
```

### Run tests locally in a single browser

Declare the `BROWSERS` env variable alongisde the `test` command to
execute tests in a specific browser.

The following will run tests for all packages in firefox:

```bash
BROWSERS=firefox npm run test
```

Available browser options for local tests include:

- chromium
- firefox
- safari

#### Run tests locally in multiple browsers

By default, executing `npm run test` runs tests in chromium, firefox, and safari
via Playwright.

```bash
# lit/
npm run test
```

The command above defaults to the following env variables:

```
BROWSERS=preset:local
CONCURRENT_BROWSERS=3
CONCURRENT_FRAMES=6
```

## Maintainers

The following section describes testing requirements for maintainers.

### Local tests

Add tests for `DEV` and `PROD` modes in the new package's `package.json` file.
Use the following syntax:

```JSON
"scripts": {
    "test": "MODE=prod npm run test:dev",
    "test:dev": "cd ../tests && npx wtr '../<package_name>/test/**/*_test.(js|html)'",
    "test:prod": "MODE=prod npm run test:dev"
}
```

### Remote tests

All packages should be tested remotely.

### Prepare tests

Inside `web-test-runner.saucelabs.config.js` is a list called `files` that provides
web test runner test files for saucelabs.

Add new package tests to this list to include them in a remote test run.

```TS
const files = [
    ...
    '../<package_name>/test/**/*_test.(js|html)',
];
```

### Run tests remotely via saucelabs

The instructions how to run remote tests from your local machine safely.

### Prepare environment variables

Remote tests require the following environment variables:

- SAUCE_USERNAME
- SAUCE_ACCESS_KEY
- SAUCE_TUNNEL_ID

Gather your saucelabs credentials. DO NOT UPLOAD THEM TO GITHUB.

If saucelabs credentials are uploaded to github, contact your tech lead.
They will update the access key.

#### Create a helper script

Create a helper script outside of the copy of the repo.

This has the benefit of not polluting repo-specific variables in a
`.bashrc` file while providing a quick way to change env variables.
It has the added benefit of being easily deleted
while not creating side effects in system environments.

```bash
pwd # home/<user>/lit/
cd ../
touch run-sauce-tests.sh
```

Next, copy and paste the following into `run-sauce-tests.sh`:

```bash
export SAUCE_USERNAME=<organization>
export SAUCE_ACCESS_KEY=<access_key>
export SAUCE_TUNNEL_ID=preset:local_dev__$(date +%s)
export BROWSERS=<browser-type>
export CONCURRENT_BROWSERS=3
export CONCURRENT_FRAMES=6

cd lit/packages/tests
npm run test
```

Afterwards, replace `<organization>` with a saucelabs username and
`<access_key>` with a saucelabs access key.

#### Run tests in individual browsers

Tests can deploy to individual browsers by changing the `BROWSERS`
variable in the `run-sauce-tests.sh` script.

Valid `BROWSERS` variables for individual browsers include:

- chromium
- firefox
- safari
- ie

For example, replace `<browser-type>` with `firefox`:

```bash
BROWSERS=firefox
```

#### Run tests in multiple browers

This package can deploy tests for groups of browsers.

To run tests in multiple browsers, change the `BROWSERS` variable in
`run-sauce-tests.sh` to `sauce` or `sauce-ie11`

For example, replace `<browser-type>` with `sauce` to run tests firefox, chromium, and safari:

```bash
BROWSERS=sauce
```

#### Run the helper script

After the correct environment variables have been set, run remote
tests by executing the helper script.

```bash
bash run-sauce-tests.sh
```

## Contributing

Please see [CONTRIBUTING.md](../../CONTRIBUTING.md).
