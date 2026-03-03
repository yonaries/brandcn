import { updateSettings } from "@clack/core"

import { addCommand, parseAddArgs, runAddCommand } from "./commands/add.js"
import { listCommand, parseListArgs, runListCommand } from "./commands/list.js"
import {
  getPackageVersion,
  parseVersionArgs,
  runVersionCommand,
  versionCommand,
} from "./commands/version.js"
import { displayError } from "./utils/log.js"
import { color } from "./utils/style.js"

interface FlagDefinition {
  char: string
  description: string
}

interface CommandDefinition {
  description: string
  examples: readonly string[]
  flags: { [key: string]: FlagDefinition }
  name: string
  usage: string
}

const commands: CommandDefinition[] = [addCommand, listCommand, versionCommand]

const getCommand = (name: string): CommandDefinition | undefined => {
  return commands.find((command) => command.name === name)
}

const printMainHelp = (): void => {
  console.log(color.highlight("brandcn"))
  console.log(
    "Add high-quality brand logos to your project instantly — just like adding components with shadcn/ui.",
  )
  console.log("")
  console.log(color.info("Usage"))
  console.log(`  ${color.command("brandcn <command> [options]")}`)
  console.log("")
  console.log(color.info("Commands"))

  for (const command of commands) {
    console.log(
      `  ${color.command(command.name.padEnd(8))}${command.description}`,
    )
  }

  console.log("")
  console.log(color.info("Global options"))
  console.log(`  ${color.command("-h, --help")}       Show help`)
  console.log(`  ${color.command("-v, --version")}    Show version`)
  console.log("")
  console.log(
    `Run ${color.command("brandcn help <command>")} for command-specific help.`,
  )
}

const printCommandHelp = (command: CommandDefinition): void => {
  console.log(color.highlight(`brandcn ${command.name}`))
  console.log(command.description)
  console.log("")
  console.log(color.info("Usage"))
  console.log(`  ${color.command(command.usage)}`)
  console.log("")
  console.log(color.info("Options"))

  for (const [flagName, flag] of Object.entries(command.flags)) {
    console.log(`  -${flag.char}, --${flagName.padEnd(10)}${flag.description}`)
  }

  if (0 < command.examples.length) {
    console.log("")
    console.log(color.info("Examples"))

    for (const example of command.examples) {
      console.log(`  ${example}`)
    }
  }
}

const runHelpCommand = (args: string[]): number => {
  if (0 === args.length) {
    printMainHelp()
    return 0
  }

  const command = getCommand(args[0])

  if (!command) {
    displayError(`Unknown command "${args[0]}"`)
    printMainHelp()
    return 1
  }

  printCommandHelp(command)
  return 0
}

export const runCli = async (
  argv: string[] = process.argv.slice(2),
): Promise<number> => {
  updateSettings({ aliases: {} })

  if (0 === argv.length) {
    printMainHelp()
    return 0
  }

  const [commandName, ...restArgs] = argv

  if ("-h" === commandName || "--help" === commandName) {
    printMainHelp()
    return 0
  }

  if ("-v" === commandName || "--version" === commandName) {
    return runVersionCommand()
  }

  if ("help" === commandName) {
    return runHelpCommand(restArgs)
  }

  if (commandName === addCommand.name) {
    try {
      const parsed = parseAddArgs(restArgs)

      if (parsed.help) {
        printCommandHelp(addCommand)
        return 0
      }

      return await runAddCommand(parsed.logoNames, parsed.flags)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid options"
      displayError(message)
      printCommandHelp(addCommand)
      return 1
    }
  }

  if (commandName === listCommand.name) {
    try {
      const parsed = parseListArgs(restArgs)

      if (parsed.help) {
        printCommandHelp(listCommand)
        return 0
      }

      return await runListCommand(parsed.flags)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid options"
      displayError(message)
      printCommandHelp(listCommand)
      return 1
    }
  }

  if (commandName === versionCommand.name) {
    try {
      const parsed = parseVersionArgs(restArgs)

      if (parsed.help) {
        printCommandHelp(versionCommand)
        return 0
      }

      return runVersionCommand()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid options"
      displayError(message)
      printCommandHelp(versionCommand)
      return 1
    }
  }

  displayError(`Unknown command "${commandName}"`)
  printMainHelp()
  return 1
}

export const getVersion = (): null | string => {
  return getPackageVersion()
}
