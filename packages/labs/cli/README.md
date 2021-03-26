# @lit/cli

Tooling for Lit development

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@lit/cli.svg)](https://npmjs.org/package/@lit/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@lit/cli.svg)](https://npmjs.org/package/@lit/cli)
[![License](https://img.shields.io/npm/l/@lit/cli.svg)](https://github.com/Polymer/lit-html/blob/master/package.json)

<!-- toc -->

- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @lit/cli
$ lit COMMAND
running command...
$ lit (-v|--version|version)
@lit/cli/0.0.0 darwin-x64 node-v15.4.0
$ lit --help [COMMAND]
USAGE
  $ lit COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`lit hello [FILE]`](#lit-hello-file)
- [`lit help [COMMAND]`](#lit-help-command)

## `lit hello [FILE]`

describe the command here

```
USAGE
  $ lit hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ lit hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/Polymer/lit-html/blob/v0.0.0/src/commands/hello.ts)_

## `lit help [COMMAND]`

display help for lit

```
USAGE
  $ lit help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

<!-- commandsstop -->
