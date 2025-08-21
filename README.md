brandcn
=================

brandcn is a CLI tool that lets you quickly pull and add high-quality brand logos to your project — just like adding components with shadcn/ui.


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/brandcn.svg)](https://npmjs.org/package/brandcn)
[![Downloads/week](https://img.shields.io/npm/dw/brandcn.svg)](https://npmjs.org/package/brandcn)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g brandcn
$ brandcn COMMAND
running command...
$ brandcn (--version)
brandcn/0.0.0 darwin-arm64 node-v20.18.1
$ brandcn --help [COMMAND]
USAGE
  $ brandcn COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`brandcn hello PERSON`](#brandcn-hello-person)
* [`brandcn hello world`](#brandcn-hello-world)
* [`brandcn help [COMMAND]`](#brandcn-help-command)
* [`brandcn plugins`](#brandcn-plugins)
* [`brandcn plugins add PLUGIN`](#brandcn-plugins-add-plugin)
* [`brandcn plugins:inspect PLUGIN...`](#brandcn-pluginsinspect-plugin)
* [`brandcn plugins install PLUGIN`](#brandcn-plugins-install-plugin)
* [`brandcn plugins link PATH`](#brandcn-plugins-link-path)
* [`brandcn plugins remove [PLUGIN]`](#brandcn-plugins-remove-plugin)
* [`brandcn plugins reset`](#brandcn-plugins-reset)
* [`brandcn plugins uninstall [PLUGIN]`](#brandcn-plugins-uninstall-plugin)
* [`brandcn plugins unlink [PLUGIN]`](#brandcn-plugins-unlink-plugin)
* [`brandcn plugins update`](#brandcn-plugins-update)

## `brandcn hello PERSON`

Say hello

```
USAGE
  $ brandcn hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ brandcn hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/yonaries/brandcn/blob/v0.0.0/src/commands/hello/index.ts)_

## `brandcn hello world`

Say hello world

```
USAGE
  $ brandcn hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ brandcn hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/yonaries/brandcn/blob/v0.0.0/src/commands/hello/world.ts)_

## `brandcn help [COMMAND]`

Display help for brandcn.

```
USAGE
  $ brandcn help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for brandcn.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.32/src/commands/help.ts)_

## `brandcn plugins`

List installed plugins.

```
USAGE
  $ brandcn plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ brandcn plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/index.ts)_

## `brandcn plugins add PLUGIN`

Installs a plugin into brandcn.

```
USAGE
  $ brandcn plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into brandcn.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the BRANDCN_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the BRANDCN_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ brandcn plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ brandcn plugins add myplugin

  Install a plugin from a github url.

    $ brandcn plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ brandcn plugins add someuser/someplugin
```

## `brandcn plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ brandcn plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ brandcn plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/inspect.ts)_

## `brandcn plugins install PLUGIN`

Installs a plugin into brandcn.

```
USAGE
  $ brandcn plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into brandcn.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the BRANDCN_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the BRANDCN_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ brandcn plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ brandcn plugins install myplugin

  Install a plugin from a github url.

    $ brandcn plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ brandcn plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/install.ts)_

## `brandcn plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ brandcn plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ brandcn plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/link.ts)_

## `brandcn plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ brandcn plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ brandcn plugins unlink
  $ brandcn plugins remove

EXAMPLES
  $ brandcn plugins remove myplugin
```

## `brandcn plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ brandcn plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/reset.ts)_

## `brandcn plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ brandcn plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ brandcn plugins unlink
  $ brandcn plugins remove

EXAMPLES
  $ brandcn plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/uninstall.ts)_

## `brandcn plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ brandcn plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ brandcn plugins unlink
  $ brandcn plugins remove

EXAMPLES
  $ brandcn plugins unlink myplugin
```

## `brandcn plugins update`

Update installed plugins.

```
USAGE
  $ brandcn plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.46/src/commands/plugins/update.ts)_
<!-- commandsstop -->
