import { execa } from "execa"
import fs from "fs-extra"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"

import { color } from "../utils/style.js"

const { readFileSync } = fs

const versionOptions = {
  help: {
    short: "h",
    type: "boolean",
  },
} as const

export const versionCommand = {
  description: "Display version information",
  examples: ["$ brandcn version", "$ brandcn --version"],
  flags: {
    help: {
      char: "h",
      description: "Show help for the version command",
    },
  },
  name: "version",
  usage: "brandcn version",
} as const

export interface VersionParsedArgs {
  help: boolean
}

export const parseVersionArgs = (args: string[]): VersionParsedArgs => {
  const parsed = parseArgs({
    allowPositionals: true,
    args,
    options: versionOptions,
    strict: true,
  })

  if (0 < parsed.positionals.length) {
    throw new TypeError(
      `Unexpected positional arguments: ${parsed.positionals.join(", ")}`,
    )
  }

  return {
    help: Boolean(parsed.values.help),
  }
}

export const getPackageVersion = (): null | string => {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const packagePath = join(currentDir, "..", "..", "package.json")

  try {
    const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as {
      version?: string
    }

    if (!pkg.version) {
      return null
    }

    return pkg.version
  } catch {
    return null
  }
}

export const runVersionCommand = async (): Promise<number> => {
  const version = getPackageVersion()

  if (!version) {
    console.log(color.error("Version not found"))
    return 1
  }

  let nodeVersion = ""
  try {
    const result = await execa(process.execPath, ["--version"])
    nodeVersion = result.stdout.trim()
  } catch {
    nodeVersion = process.version
  }

  console.log(
    `${color.highlight("brandcn")} ${color.success(`v${version}`)} ${color.dim(`(${nodeVersion})`)}`,
  )
  return 0
}
