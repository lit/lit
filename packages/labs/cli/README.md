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

- [`help`](#help)
- [`localize`](#localize)
- [`labs gen`](#gen)

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
