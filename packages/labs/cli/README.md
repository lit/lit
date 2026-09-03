# @lit-labs/cli

The `lit` command line tool for Lit.

The Lit CLI is a common place for utilities maintained by the Lit team.

> IMPORTANT: ⚠️ `@lit-labs/cli` is currently available only as a _pre-release_
> for early testing. Feel free to try it out, but expect occasional bugs,
> missing features, and frequent breaking changes! ⚠️

## Installation

Install globally, so you can run the `lit` command anywhere on your system:

```sh
npm i -g @lit-labs/cli
```

Or install into a project, so that the correct version is installed with other dependencies:

```sh
cd my-project
npm i -D @lit-labs/cli
```

## Commands

- [`init`](#init)
- [`help`](#help)
- [`localize`](#localize)
- [`labs gen`](#gen)

### `init`

Initialize a Lit project

#### Usage

```sh
$ lit init element --lang=ts --name=my-custom-element --out=./elements
```

#### Flags

| Flag     | Description                                                                        |
| -------- | ---------------------------------------------------------------------------------- |
| `--lang` | Which language to use for the element. Default: `js`. Supported languages: js, ts  |
| `--name` | Tag name of the Element to generate (must include a hyphen). Default: `my-element` |
| `--out`  | Directory in which to generate the element package. Default: `./`                  |

### `help`

Displays a help message with available commands.

#### Usage

```sh
$ lit help
```

### `localize`

Extract localization messages or build a localized application.

#### Usage

```sh
$ lit localize extract
$ lit localize build
```

### `labs gen`

Generate framework wrappers.

#### Usage

```sh
$ lit labs gen --framework=react
```

#### Flags

| Flag          | Description                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `--framework` | Framework(s) to generate wrappers for. Supported frameworks: `react`, `vue`. Can be specified multiple times. |
| `--package`   | Folder(s) containing a package to generate wrappers for. Default: `./`. Can be specified multiple times.      |
| `--out`       | Folder to output generated packages to. Default: `./gen/`                                                     |
| `--manifest`  | Generate a custom-elements.json manifest for this package. Default: `false`                                   |
| `--exclude`   | Glob of source files to exclude from analysis. Default: `[]`                                                  |
